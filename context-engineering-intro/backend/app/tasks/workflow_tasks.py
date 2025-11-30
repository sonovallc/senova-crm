"""
Celery tasks for workflow automation execution

⚠️ WARNING: This workflow automation system is NOT CURRENTLY ACTIVE
- Workflow triggers are defined in app/models/workflow.py
- Execution logic exists but is never called from the codebase
- No event listeners or database triggers are configured
- ActivityLogger does NOT trigger workflows
- To activate: Import and call execute_workflow_task() from relevant event handlers

Features (when activated):
- Workflow trigger processing
- Action execution with conditional logic
- Delay support for timed actions
- Error handling and retry logic
"""

import asyncio
from typing import Dict, List, Optional
from uuid import UUID
from datetime import datetime, timezone

from celery import Task
from celery.utils.log import get_task_logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_app import celery_app
from app.tasks.email_tasks import send_email_task, send_template_email_task
from app.tasks.sms_tasks import send_sms_task
from app.config.database import AsyncSessionLocal
from app.models.workflow import Workflow, WorkflowExecution
from app.models.contact import Contact
from app.core.exceptions import IntegrationError

logger = get_task_logger(__name__)


class WorkflowTask(Task):
    """Base task for workflow execution"""

    autoretry_for = (Exception,)
    retry_kwargs = {"max_retries": 2}
    retry_backoff = True


@celery_app.task(base=WorkflowTask, bind=True)
def execute_workflow_task(
    self,
    workflow_id: str,
    trigger_data: Dict,
    contact_id: Optional[str] = None,
) -> Dict:
    """
    Execute workflow actions based on trigger

    Args:
        workflow_id: Workflow to execute
        trigger_data: Data from the trigger event
        contact_id: Optional contact ID for context

    Returns:
        Dict with execution results
    """
    logger.info(f"Executing workflow {workflow_id}")

    async def _execute_workflow():
        async with AsyncSessionLocal() as db:
            # Get workflow
            workflow_result = await db.execute(
                select(Workflow).where(Workflow.id == UUID(workflow_id))
            )
            workflow = workflow_result.scalar_one_or_none()

            if not workflow or not workflow.is_active:
                logger.warning(f"Workflow {workflow_id} not found or inactive")
                return {"status": "skipped", "reason": "workflow_inactive"}

            # Get contact if provided
            contact = None
            if contact_id:
                contact_result = await db.execute(
                    select(Contact).where(Contact.id == UUID(contact_id))
                )
                contact = contact_result.scalar_one_or_none()

            # Check conditions
            if workflow.conditions:
                if not _check_conditions(workflow.conditions, trigger_data, contact):
                    logger.info(f"Workflow {workflow_id} conditions not met")
                    return {"status": "skipped", "reason": "conditions_not_met"}

            # Create execution record
            execution = WorkflowExecution(
                workflow_id=workflow.id,
                contact_id=UUID(contact_id) if contact_id else None,
                trigger_data=trigger_data,
                status="running",
                started_at=datetime.now(timezone.utc),
            )
            db.add(execution)
            await db.commit()
            await db.refresh(execution)

            # Execute actions
            action_results = []
            success_count = 0
            failure_count = 0

            try:
                for action in workflow.actions:
                    action_type = action.get("type")
                    delay_minutes = action.get("delay_minutes", 0)

                    # Apply delay if specified
                    if delay_minutes > 0:
                        logger.info(
                            f"Delaying action '{action_type}' by {delay_minutes} minutes"
                        )
                        await asyncio.sleep(delay_minutes * 60)

                    # Execute action
                    try:
                        result = await _execute_action(
                            action, trigger_data, contact, db
                        )
                        action_results.append(
                            {
                                "action": action_type,
                                "status": "success",
                                "result": result,
                            }
                        )
                        success_count += 1
                    except Exception as e:
                        logger.error(f"Action '{action_type}' failed: {str(e)}")
                        action_results.append(
                            {
                                "action": action_type,
                                "status": "failed",
                                "error": str(e),
                            }
                        )
                        failure_count += 1

                # Update execution record
                execution.status = (
                    "completed" if failure_count == 0 else "completed_with_errors"
                )
                execution.completed_at = datetime.now(timezone.utc)
                execution.action_results = action_results
                execution.success_count = success_count
                execution.failure_count = failure_count

                # Update workflow statistics
                workflow.execution_count += 1
                if failure_count > 0:
                    workflow.failure_count += 1

                await db.commit()

                logger.info(
                    f"Workflow {workflow_id} completed: {success_count} successes, {failure_count} failures"
                )

                return {
                    "status": "completed",
                    "execution_id": str(execution.id),
                    "success_count": success_count,
                    "failure_count": failure_count,
                    "action_results": action_results,
                }

            except Exception as e:
                logger.error(f"Workflow {workflow_id} execution failed: {str(e)}")

                execution.status = "failed"
                execution.completed_at = datetime.now(timezone.utc)
                execution.error_message = str(e)

                workflow.execution_count += 1
                workflow.failure_count += 1

                await db.commit()

                raise

    return asyncio.run(_execute_workflow())


def _check_conditions(conditions: Dict, trigger_data: Dict, contact: Optional[Contact]) -> bool:
    """
    Check if workflow conditions are met

    Args:
        conditions: Workflow conditions (AND logic)
        trigger_data: Trigger event data
        contact: Contact object for attribute checking

    Returns:
        True if all conditions met
    """
    # Example condition structure:
    # {
    #   "field": "contact.status",
    #   "operator": "equals",
    #   "value": "lead"
    # }

    for condition in conditions.get("conditions", []):
        field = condition.get("field")
        operator = condition.get("operator")
        expected_value = condition.get("value")

        # Get actual value
        if field.startswith("contact."):
            if not contact:
                return False
            attr = field.replace("contact.", "")
            actual_value = getattr(contact, attr, None)
        elif field.startswith("trigger."):
            attr = field.replace("trigger.", "")
            actual_value = trigger_data.get(attr)
        else:
            actual_value = trigger_data.get(field)

        # Check operator
        if operator == "equals" and actual_value != expected_value:
            return False
        elif operator == "not_equals" and actual_value == expected_value:
            return False
        elif operator == "contains" and expected_value not in str(actual_value):
            return False
        elif operator == "greater_than" and not (actual_value > expected_value):
            return False
        elif operator == "less_than" and not (actual_value < expected_value):
            return False

    return True


async def _execute_action(
    action: Dict,
    trigger_data: Dict,
    contact: Optional[Contact],
    db: AsyncSession,
) -> Dict:
    """
    Execute single workflow action

    Args:
        action: Action configuration
        trigger_data: Trigger event data
        contact: Contact object
        db: Database session

    Returns:
        Dict with action result
    """
    action_type = action.get("type")

    if action_type == "send_email":
        # Queue email task
        template_id = action.get("template_id")
        if template_id:
            # Use template
            task = send_template_email_task.delay(
                communication_id=str(UUID()),  # Create new comm record
                to_email=contact.email if contact else action.get("to_email"),
                template_name=template_id,
                template_variables={"contact": contact.__dict__} if contact else {},
            )
        else:
            # Custom email
            task = send_email_task.delay(
                communication_id=str(UUID()),
                to_email=contact.email if contact else action.get("to_email"),
                subject=action.get("subject", ""),
                html_body=action.get("html_body"),
                text_body=action.get("text_body"),
            )

        return {"task_id": task.id, "status": "queued"}

    elif action_type == "send_sms":
        # Queue SMS task
        task = send_sms_task.delay(
            communication_id=str(UUID()),
            to_number=contact.phone if contact else action.get("to_number"),
            text=action.get("text", ""),
        )

        return {"task_id": task.id, "status": "queued"}

    elif action_type == "add_tag":
        # Add tag to contact
        if contact:
            tag = action.get("tag")
            if tag and tag not in contact.tags:
                contact.tags.append(tag)
                await db.commit()
            return {"tag": tag, "status": "added"}

    elif action_type == "remove_tag":
        # Remove tag from contact
        if contact:
            tag = action.get("tag")
            if tag in contact.tags:
                contact.tags.remove(tag)
                await db.commit()
            return {"tag": tag, "status": "removed"}

    elif action_type == "update_field":
        # Update contact field
        if contact:
            field = action.get("field")
            value = action.get("value")
            setattr(contact, field, value)
            await db.commit()
            return {"field": field, "value": value, "status": "updated"}

    elif action_type == "enrich_contact":
        # Queue enrichment (placeholder for AudienceLab integration)
        logger.info(f"Contact enrichment queued for {contact.id if contact else 'unknown'}")
        return {"status": "queued_for_enrichment"}

    return {"status": "unknown_action_type", "action_type": action_type}

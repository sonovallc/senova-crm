import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Senova',
  description: 'Refund and cancellation policy for Senova services and VIP memberships.',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">Refund & Cancellation Policy</h1>
        <p className="mb-6 text-sm text-slate-600" suppressHydrationWarning>Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Appointment Cancellations</h2>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">24-Hour Cancellation Policy</h3>
            <p className="mb-4">
              We require at least 24 hours advance notice for all appointment cancellations or rescheduling. This allows us to
              offer the time slot to other clients who may be waiting.
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li><strong>24+ hours notice:</strong> Full refund or reschedule with no penalty</li>
              <li><strong>Less than 24 hours:</strong> 50% cancellation fee may apply</li>
              <li><strong>No-show:</strong> Full service charge will be applied</li>
              <li><strong>Emergency situations:</strong> Considered on a case-by-case basis</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. Service Deposits</h2>
            <p className="mb-4">Certain services require a non-refundable deposit to secure your appointment:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Permanent Makeup Services:</strong> $100-$200 deposit required</li>
              <li><strong>Multi-session packages:</strong> 50% deposit may be required</li>
              <li><strong>Deposits are applied to final service cost</strong></li>
              <li><strong>Deposits are non-refundable</strong> but may be transferred to another service within 6 months</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. Service Refunds</h2>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Permanent Makeup Services</h3>
            <p className="mb-4">
              Due to the permanent nature of PMU services and the skill, time, and products involved, we do not offer refunds
              once the service has been performed. However:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Free touch-up session included within 6-8 weeks of initial service</li>
              <li>Color correction or adjustments available if results differ from agreed-upon plan</li>
              <li>We work with you to ensure your complete satisfaction</li>
            </ul>

            <h3 className="mb-2 mt-6 text-xl font-semibold text-slate-800">Skin Treatments & Body Contouring</h3>
            <p className="mb-4">
              Results vary by individual. Refunds are not provided for services that have been performed, but we will:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Provide complimentary consultation to discuss concerns</li>
              <li>Adjust treatment plan if necessary</li>
              <li>Offer alternative treatments if appropriate</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. VIP Membership Cancellations</h2>
            <p className="mb-4">Our VIP memberships require a minimum commitment:</p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li><strong>Minimum term:</strong> 3-month commitment required for all tiers</li>
              <li><strong>Cancellation notice:</strong> 30 days written notice required</li>
              <li><strong>No refunds</strong> for partial months or unused benefits</li>
              <li><strong>Benefits do not roll over</strong> to the following month</li>
              <li><strong>Pause option:</strong> Memberships may be paused for medical reasons (1 month maximum per year)</li>
            </ul>

            <h3 className="mb-2 mt-6 text-xl font-semibold text-slate-800">How to Cancel Membership</h3>
            <p className="mb-4">To cancel your VIP membership:</p>
            <ol className="list-decimal space-y-2 pl-6">
              <li>Submit written cancellation request via email to info@senovallc.com</li>
              <li>Include your name, membership tier, and reason for cancellation (optional)</li>
              <li>Cancellation will be effective after 30-day notice period</li>
              <li>Final payment will be processed for the notice period</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Product Returns</h2>
            <p className="mb-4">Retail products purchased at our salon:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Unopened products:</strong> Returns accepted within 14 days with receipt</li>
              <li><strong>Opened products:</strong> Exchange only (no refunds) within 7 days</li>
              <li><strong>Damaged products:</strong> Full refund or replacement within 30 days</li>
              <li><strong>Aftercare products:</strong> No returns due to hygiene regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Package Deals & Promotions</h2>
            <p className="mb-4">Special offers and package deals:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Must be used within validity period (typically 6-12 months)</li>
              <li>Extensions may be granted for medical emergencies</li>
              <li>No refunds for unused portions of package deals</li>
              <li>Cannot be combined with other promotions unless stated</li>
              <li>Non-transferable to other individuals</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. Gift Certificates</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Valid for 1 year from purchase date</li>
              <li>Non-refundable and cannot be redeemed for cash</li>
              <li>Can be used toward any service or product</li>
              <li>Lost or stolen certificates cannot be replaced</li>
              <li>Transferable to other individuals</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">8. Payment Disputes</h2>
            <p className="mb-4">
              If you believe you were charged in error or have a billing dispute:
            </p>
            <ol className="list-decimal space-y-2 pl-6">
              <li>Contact us within 30 days of the charge</li>
              <li>Provide your receipt and explanation of the dispute</li>
              <li>We will investigate and respond within 5 business days</li>
              <li>Refunds for billing errors will be processed within 10 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">9. Medical Contraindications</h2>
            <p className="mb-4">
              If you are unable to receive a scheduled service due to medical contraindications discovered during consultation:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Full refund provided (including deposit)</li>
              <li>May reschedule once contraindication is resolved</li>
              <li>Alternative treatment options will be suggested when possible</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">10. Contact Us</h2>
            <p className="mb-4">Questions about our refund policy? Contact us:</p>
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-6">
              <p className="mb-2"><strong>Senova</strong></p>
              <p className="mb-2">556 Salem Street</p>
              <p className="mb-2">Wakefield, MA 01880</p>
              <p className="mb-2">Phone: (781) 451-1594</p>
              <p>Email: info@senovallc.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

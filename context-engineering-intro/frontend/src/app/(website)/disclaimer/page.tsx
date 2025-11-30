import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | Senova',
  description: 'Medical disclaimer and important information about services provided by Senova.',
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">Disclaimer</h1>
        <p className="mb-6 text-sm text-slate-600" suppressHydrationWarning>Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">1. Medical Disclaimer</h2>
            <p className="mb-4">
              The information provided by Senova on our website and during consultations is for general informational
              purposes only. All information is provided in good faith, however we make no representation or warranty of any
              kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness
              of any information.
            </p>
            <p className="mb-4">
              <strong>The services we provide are cosmetic in nature and are not intended to diagnose, treat, cure, or prevent
              any disease.</strong> While our treatments are performed by licensed and certified professionals, individual
              results may vary.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">2. Professional Qualifications</h2>
            <p className="mb-4">
              Our team includes licensed estheticians, certified permanent makeup artists, and other qualified beauty
              professionals. All practitioners maintain appropriate licenses and certifications as required by Massachusetts
              state law.
            </p>
            <p>
              Our physical therapist is licensed and operates within their scope of practice. Dry needling services are
              performed in accordance with Massachusetts physical therapy regulations.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">3. Results May Vary</h2>
            <p className="mb-4">
              Before and after photos, testimonials, and case studies presented on our website or social media represent
              individual experiences and results. They are not guarantees of specific results for all clients.
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Individual results depend on factors including skin type, age, lifestyle, and adherence to aftercare</li>
              <li>Permanent makeup results vary based on skin chemistry and healing process</li>
              <li>Body contouring and skin treatment results require multiple sessions and maintenance</li>
              <li>Photos may be edited for lighting and clarity but accurately represent actual results</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">4. Consultation Requirement</h2>
            <p className="mb-4">
              A professional consultation is required before receiving permanent makeup, body contouring, or certain advanced
              skin treatments. During this consultation, we will:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Assess your suitability for the requested treatment</li>
              <li>Review your medical history and contraindications</li>
              <li>Discuss realistic expectations and potential risks</li>
              <li>Create a customized treatment plan</li>
              <li>Answer all questions about the procedure</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">5. Contraindications & Medical Conditions</h2>
            <p className="mb-4">
              Certain medical conditions may prevent you from receiving specific services. Please inform us if you have:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Pregnancy or breastfeeding status</li>
              <li>Autoimmune disorders or compromised immune system</li>
              <li>Active skin infections or conditions (eczema, psoriasis, rosacea)</li>
              <li>Blood-thinning medications or bleeding disorders</li>
              <li>History of keloid scarring or poor wound healing</li>
              <li>Allergies to pigments, numbing agents, or skincare ingredients</li>
              <li>Recent cosmetic injections or procedures</li>
              <li>Pacemaker or metal implants (for certain treatments)</li>
            </ul>
            <p>
              <strong>You must consult with your physician before receiving services if you have any medical concerns or
              conditions.</strong>
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">6. Risks & Side Effects</h2>
            <p className="mb-4">
              All cosmetic procedures carry potential risks. Common temporary side effects may include:
            </p>

            <h3 className="mb-2 text-xl font-semibold text-slate-800">Permanent Makeup</h3>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Swelling, redness, and tenderness (1-7 days)</li>
              <li>Color appearing darker initially, lightening during healing (4-6 weeks)</li>
              <li>Itching during healing process</li>
              <li>Potential for infection if aftercare not followed</li>
              <li>Rare: Allergic reaction, scarring, pigment migration</li>
            </ul>

            <h3 className="mb-2 text-xl font-semibold text-slate-800">Skin Treatments</h3>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Temporary redness and sensitivity</li>
              <li>Mild peeling or flaking (chemical peels)</li>
              <li>Purging or breakouts (active ingredient treatments)</li>
              <li>Sun sensitivity (requires SPF protection)</li>
            </ul>

            <h3 className="mb-2 text-xl font-semibold text-slate-800">Body Contouring</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Temporary warmth or tingling during treatment</li>
              <li>Mild bruising or soreness</li>
              <li>Results require multiple sessions</li>
              <li>Maintenance needed for lasting results</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">7. Aftercare Compliance</h2>
            <p>
              Proper aftercare is essential for optimal results and healing. Failure to follow aftercare instructions may
              result in poor healing, infection, color loss, or unsatisfactory results. <strong>Senova is not
              responsible for complications arising from failure to follow aftercare protocols.</strong>
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">8. Pricing & Service Changes</h2>
            <p className="mb-4">
              Pricing, services, and promotions are subject to change without notice. Prices listed on our website are
              approximate and may vary based on consultation and customization needs.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Final pricing confirmed during consultation</li>
              <li>Promotions cannot be combined unless stated</li>
              <li>Services may be discontinued or modified</li>
              <li>VIP membership terms may be updated with notice</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">9. External Links Disclaimer</h2>
            <p>
              Our website may contain links to third-party websites for your convenience. Senova has no control over
              and assumes no responsibility for the content, privacy policies, or practices of any third-party sites. We
              encourage you to review the policies of any website you visit.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">10. Limitation of Liability</h2>
            <p className="mb-4">
              To the fullest extent permitted by applicable law, Senova shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
              directly or indirectly.
            </p>
            <p>
              By using our services, you acknowledge that you have read, understood, and agreed to this disclaimer. You assume
              all risks associated with cosmetic procedures and release Senova from liability except in cases of gross
              negligence or willful misconduct.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">11. Photo & Video Release</h2>
            <p className="mb-4">
              With your written consent, we may photograph or video your treatment for:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>Before and after documentation</li>
              <li>Marketing and promotional materials</li>
              <li>Social media and website galleries</li>
              <li>Educational purposes and training</li>
            </ul>
            <p>
              You have the right to decline or revoke photo consent at any time. Photos will be edited to protect your privacy
              (face cropping or blurring if requested).
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-slate-900">12. Questions or Concerns</h2>
            <p className="mb-4">
              If you have any questions about this disclaimer or any service-related concerns, please contact us:
            </p>
            <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-6">
              <p className="mb-2"><strong>Senova</strong></p>
              <p className="mb-2">556 Salem Street</p>
              <p className="mb-2">Wakefield, MA 01880</p>
              <p className="mb-2">Phone: (781) 451-1594</p>
              <p>Email: info@senovallc.com</p>
            </div>
          </section>

          <section className="mt-12 rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
            <p className="font-semibold text-amber-900">
              ⚠️ IMPORTANT: By scheduling and receiving services at Senova, you acknowledge that you have read and
              understood this disclaimer and accept the associated risks and limitations.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

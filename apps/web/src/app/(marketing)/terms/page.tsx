import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms and conditions governing your use of FreightFlow.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 23, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By creating an account or using the FreightFlow platform (&quot;Service&quot;), you agree to be bound by
            these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Service. These Terms
            constitute a legally binding agreement between you and FreightFlow.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed">
            FreightFlow is an online marketplace that facilitates connections between shippers (&quot;Shippers&quot;)
            who need to transport goods and independent carriers/drivers (&quot;Drivers&quot;). FreightFlow is a
            technology platform only and is not a motor carrier, freight broker, or transportation provider.
            FreightFlow does not take possession of or assume responsibility for any goods transported through
            arrangements made on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility & Account Registration</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>You must be at least 18 years old to use the Service.</li>
            <li>Drivers must hold a valid driving licence appropriate for the vehicle type they register.</li>
            <li>You must provide accurate and complete information during registration and keep it current.</li>
            <li>You are responsible for maintaining the security of your account credentials. Notify us immediately of any unauthorised access.</li>
            <li>One account per person. You may not transfer your account to another party.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Verification</h2>
          <p className="text-gray-600 leading-relaxed">
            Drivers are required to submit identity and vehicle documents for verification before they can place bids.
            FreightFlow reviews documents in good faith but does not warrant the authenticity of any documents submitted
            by users. Submitting false or fraudulent documents will result in immediate account suspension and may
            be reported to law enforcement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Bids, Bookings, and Payments</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Shippers post shipments with optional budget ranges. Drivers submit competitive bids.</li>
            <li>Accepting a bid creates a binding agreement between the Shipper and Driver for the agreed amount.</li>
            <li>FreightFlow is not a party to the transport contract between Shippers and Drivers.</li>
            <li>Payment processing (where applicable) is subject to the terms of our payment provider.</li>
            <li>Cancellation after a Driver is en route may result in a cancellation fee as agreed between parties.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Prohibited Conduct</h2>
          <p className="text-gray-600 leading-relaxed mb-3">You must not:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Post shipments for illegal goods, hazardous materials without proper permits, or contraband.</li>
            <li>Provide false identity, licence, or insurance information.</li>
            <li>Circumvent the platform to transact directly with counterparties you met via FreightFlow.</li>
            <li>Harass, threaten, or discriminate against other users.</li>
            <li>Attempt to reverse-engineer, scrape, or disrupt the Service.</li>
            <li>Create multiple accounts or impersonate others.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Ratings and Reviews</h2>
          <p className="text-gray-600 leading-relaxed">
            After a booking is completed, both Shippers and Drivers may rate each other. Ratings must be honest
            and based on the actual transaction. FreightFlow reserves the right to remove reviews that violate
            our guidelines or that are determined to be fraudulent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
          <p className="text-gray-600 leading-relaxed">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. FREIGHTFLOW DOES NOT WARRANT THAT
            THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES. FREIGHTFLOW DOES NOT ENDORSE ANY
            DRIVER OR SHIPPER AND MAKES NO WARRANTY REGARDING THE QUALITY, SAFETY, OR LEGALITY OF ANY SHIPMENT
            OR SERVICE PROVIDED BY USERS.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, FREIGHTFLOW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING
            FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. FREIGHTFLOW&apos;S TOTAL LIABILITY TO YOU FOR ANY
            CLAIM SHALL NOT EXCEED THE GREATER OF $100 OR THE FEES PAID BY YOU TO FREIGHTFLOW IN THE 12 MONTHS
            PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Indemnification</h2>
          <p className="text-gray-600 leading-relaxed">
            You agree to indemnify and hold harmless FreightFlow and its officers, directors, employees, and agents
            from any claims, damages, or expenses (including legal fees) arising from your use of the Service,
            your violation of these Terms, or your violation of any rights of a third party.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Account Suspension and Termination</h2>
          <p className="text-gray-600 leading-relaxed">
            FreightFlow may suspend or terminate your account at any time for violation of these Terms, fraudulent
            activity, or for any other reason at our discretion. You may close your account at any time by contacting
            support. Upon termination, your right to use the Service ceases immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms are governed by the laws of the State of Illinois, United States, without regard to its
            conflict of law provisions. Any disputes shall be resolved in the courts of Cook County, Illinois,
            unless applicable law requires otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these Terms at any time. We will notify you of material changes by email or in-app notice
            at least 14 days before they take effect. Continued use of the Service after the effective date
            constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@freightflow.com" className="text-blue-600 hover:underline">
              legal@freightflow.com
            </a>{' '}
            or 123 Logistics Way, Chicago, IL 60601.
          </p>
        </section>

      </div>
    </div>
  );
}

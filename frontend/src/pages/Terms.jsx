import React from "react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 pb-24 md:pb-12">
      <h1 className="text-3xl font-bold mb-4">Terms &amp; Conditions</h1>
      <p className="text-sm text-ink/50 mb-8">Last updated 23 July 2026</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. What earnvoy is</h2>
      <p>
        earnvoy is a connection platform that introduces travellers with spare luggage space to
        senders who want something carried on that route. earnvoy only connects users - it does not
        inspect, transport, or take possession of any item at any point, and it lets people move
        small parcels quicker while travellers earn along the way.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. What earnvoy is not</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>earnvoy is not a courier.</li>
        <li>earnvoy is not an escrow service.</li>
        <li>earnvoy is not a payment guarantor.</li>
        <li>earnvoy is not an insurance provider.</li>
        <li>earnvoy is not involved in customs declarations or inspections.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Responsibilities</h2>
      <p>
        The traveller accepts responsibility for checking the contents of anything they agree to
        carry, and for following all applicable flight and baggage guidelines. The sender remains
        legally responsible for their shipment, including ensuring it contains no prohibited or
        illegal goods. earnvoy will not be responsible for any loss, damage, delay, confiscation, or
        other outcome arising from an arrangement made between users.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. If an agreement falls through</h2>
      <p>
        If a traveller and sender don't reach an agreement, or later decide not to proceed, the
        listing simply returns to the live feed as a fresh opportunity - no history or obligation
        carries over.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Staying safe</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Meet in public places.</li>
        <li>Photograph items before handover.</li>
        <li>Exchange receipts.</li>
        <li>Use a written agreement between yourselves.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Fees</h2>
      <p>
        Posting a listing (as a traveller or a sender) costs £1.75. Unlocking a listing owner's full
        name, phone number, and email also costs £1.75. These fees fund verification, moderation,
        hosting, customer service, and help keep the platform free of spam and fake accounts.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Refund policy</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>If a technical error prevents contact details from being revealed after payment, you get a refund.</li>
        <li>If you change your mind after contact details have been revealed, there is no refund.</li>
        <li>If the listing owner deletes the listing before your unlock request is accepted, you get an automatic refund or credit.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Prohibited items</h2>
      <p>
        Every sender must certify that their package contains no prohibited or illegal goods before
        posting a listing. earnvoy performs no inspection of any kind, and this certification does
        not shift legal responsibility away from the sender or traveller.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Accounts</h2>
      <p>
        We collect your full legal name for verification, but it is never shown publicly - only
        your username is visible until someone pays to unlock your contact details. You may delete
        your account or listings at any time. We may suspend or remove accounts that violate these
        terms or applicable law.
      </p>

      <p className="mt-8 text-sm text-ink/50">
        <Link to="/" className="underline">Back to the feed</Link>
      </p>
    </div>
  );
}

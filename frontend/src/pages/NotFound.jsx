import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-ink/60 mb-6">That route doesn't exist - even on earnvoy.</p>
      <Link to="/" className="btn-primary">Back to the feed</Link>
    </div>
  );
}

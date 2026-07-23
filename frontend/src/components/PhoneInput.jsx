import React, { useEffect, useMemo, useRef, useState } from "react";
import countryCodes from "../data/countryCodes";

function flagEmoji(iso2) {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/**
 * props:
 *  - onChange(fullE164Phone | "") - only emits a non-empty value once the number
 *    looks structurally valid for the chosen country; emits "" otherwise, which
 *    the parent form can treat as "not ready to submit".
 *  - defaultIso2: which country to preselect (default "GB")
 *
 * Uses a custom-rendered dropdown rather than a native <select> - native dropdowns
 * are drawn by the OS itself (not by our CSS/fonts), and Windows in particular often
 * fails to render flag emoji inside native <option> elements, and auto-sizes the
 * control to the longest option text, squeezing the number field next to it.
 * A custom list avoids both problems since we control every pixel of it.
 */
export default function PhoneInput({ onChange, defaultIso2 = "GB" }) {
  const [countryIso2, setCountryIso2] = useState(defaultIso2);
  const [national, setNational] = useState("");
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef(null);

  const country = useMemo(
    () => countryCodes.find((c) => c.iso2 === countryIso2) || countryCodes[0],
    [countryIso2]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countryCodes;
    return countryCodes.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso2.toLowerCase().includes(q)
    );
  }, [query]);

  const digitsOnly = national.replace(/\D/g, "");
  const [minDigits, maxDigits] = country.digits;
  const isValid = digitsOnly.length >= minDigits && digitsOnly.length <= maxDigits;

  useEffect(() => {
    onChange(isValid ? `+${country.dial}${digitsOnly}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitsOnly, country.dial, isValid]);

  // Close the dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(c) {
    setCountryIso2(c.iso2);
    setOpen(false);
    setQuery("");
  }

  return (
    <div>
      <div className="flex gap-2" ref={boxRef}>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="input w-[92px] flex items-center justify-between gap-1 text-left"
            aria-label="Country code"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="text-base leading-none">{flagEmoji(country.iso2)}</span>
              <span className="text-sm">+{country.dial}</span>
            </span>
            <span className="text-ink/40 text-xs">&#9662;</span>
          </button>

          {open && (
            <div className="absolute z-20 mt-1 w-64 max-h-72 overflow-hidden bg-white border border-line rounded-md shadow-lg flex flex-col">
              <input
                autoFocus
                className="input rounded-none border-x-0 border-t-0"
                placeholder="Search country or code"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <ul className="overflow-y-auto">
                {results.length === 0 && (
                  <li className="px-3 py-2 text-sm text-ink/40">No countries match.</li>
                )}
                {results.map((c) => (
                  <li
                    key={c.iso2}
                    onClick={() => pick(c)}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-ink/5 ${
                      c.iso2 === countryIso2 ? "bg-signal/10" : ""
                    }`}
                  >
                    <span className="text-base leading-none">{flagEmoji(c.iso2)}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-ink/40">+{c.dial}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <input
          className="input flex-1 min-w-0"
          type="tel"
          inputMode="numeric"
          placeholder="Phone number"
          value={national}
          onChange={(e) => setNational(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      </div>
      {touched && digitsOnly.length > 0 && !isValid && (
        <p className="text-alert text-xs mt-1">
          That doesn't look like a valid {country.name} number - expected {minDigits === maxDigits ? minDigits : `${minDigits}-${maxDigits}`} digits after the country code.
        </p>
      )}
      {isValid && (
        <p className="text-route text-xs mt-1">Looks good: +{country.dial}{digitsOnly}</p>
      )}
    </div>
  );
}

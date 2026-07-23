import React, { useEffect, useMemo, useState } from "react";
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
 */
export default function PhoneInput({ onChange, defaultIso2 = "GB" }) {
  const [countryIso2, setCountryIso2] = useState(defaultIso2);
  const [national, setNational] = useState("");
  const [touched, setTouched] = useState(false);

  const country = useMemo(
    () => countryCodes.find((c) => c.iso2 === countryIso2) || countryCodes[0],
    [countryIso2]
  );

  const digitsOnly = national.replace(/\D/g, "");
  const [minDigits, maxDigits] = country.digits;
  const isValid = digitsOnly.length >= minDigits && digitsOnly.length <= maxDigits;

  useEffect(() => {
    onChange(isValid ? `+${country.dial}${digitsOnly}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitsOnly, country.dial, isValid]);

  return (
    <div>
      <div className="flex gap-2">
        <select
          className="input w-auto shrink-0"
          value={countryIso2}
          onChange={(e) => setCountryIso2(e.target.value)}
          aria-label="Country code"
        >
          {countryCodes.map((c) => (
            <option key={c.iso2} value={c.iso2}>
              {flagEmoji(c.iso2)} +{c.dial} {c.name}
            </option>
          ))}
        </select>
        <input
          className="input"
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

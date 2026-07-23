import React, { useMemo, useRef, useState } from "react";
import airports from "../data/airports";

/**
 * props:
 *  - value: IATA code string, e.g. "LHR"
 *  - onChange: (code) => void
 *  - onSelectAirport: (airport) => void - optional, fires with the full airport
 *    object {code, city, country, name} when the caller also needs the country
 *  - placeholder
 */
export default function AirportSelect({ value, onChange, onSelectAirport, placeholder = "Search airport or city" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef(null);

  const selected = airports.find((a) => a.code === value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return airports.slice(0, 8);
    return airports
      .filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query]);

  function pick(airport) {
    onChange(airport.code);
    if (onSelectAirport) onSelectAirport(airport);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && results[highlight]) { e.preventDefault(); pick(results[highlight]); }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        className="input"
        placeholder={placeholder}
        value={open ? query : selected ? `${selected.code} - ${selected.city}, ${selected.country}` : ""}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-line rounded-md shadow-lg">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-ink/40">No airports match.</li>}
          {results.map((a, i) => (
            <li
              key={a.code}
              className={`px-3 py-2 text-sm cursor-pointer flex justify-between ${i === highlight ? "bg-signal/20" : "hover:bg-ink/5"}`}
              onMouseDown={() => pick(a)}
              onMouseEnter={() => setHighlight(i)}
            >
              <span><strong>{a.code}</strong> - {a.city}, {a.country}</span>
              <span className="text-ink/40">{a.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/client";

function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/analytics").then((res) => setData(res.data)); }, []);
  if (!data) return <p className="text-ink/50 text-sm">Loading...</p>;

  const stats = [
    ["Users", data.userCount],
    ["Verified users", data.verifiedCount],
    ["Listings", data.listingCount],
    ["Matched", data.matchedCount],
    ["Open reports", data.openReports],
    ["Total revenue", `£${data.totalRevenue.toFixed(2)}`],
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {stats.map(([label, value]) => (
        <div key={label} className="card p-4">
          <p className="text-xs text-ink/50">{label}</p>
          <p className="text-2xl font-bold font-display">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await api.get("/admin/users", { params: { q } });
    setUsers(res.data.users);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function toggleSuspend(u) {
    await api.patch(`/admin/users/${u.id}`, { isSuspended: !u.isSuspended });
    toast.success(u.isSuspended ? "User reinstated" : "User suspended");
    load();
  }

  async function remove(u) {
    if (!confirm(`Delete ${u.username}'s account?`)) return;
    await api.delete(`/admin/users/${u.id}`);
    toast.success("Account deleted");
    load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder="Search username or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-secondary" onClick={load}>Search</button>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card p-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{u.username} {u.isVerifiedBadge && <span className="badge-verified ml-1">Verified</span>}</p>
              <p className="text-xs text-ink/50">{u.email} - {u.role} - {u.isSuspended ? "Suspended" : "Active"}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary py-1 px-3 text-xs" onClick={() => toggleSuspend(u)}>
                {u.isSuspended ? "Reinstate" : "Suspend"}
              </button>
              <button className="text-xs text-alert underline" onClick={() => remove(u)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListingsAdmin() {
  const [listings, setListings] = useState([]);
  useEffect(() => { api.get("/admin/listings").then((res) => setListings(res.data.listings)); }, []);

  async function remove(l) {
    const reason = prompt("Reason for removing this listing?") || "";
    await api.delete(`/admin/listings/${l.id}`, { data: { reason } });
    toast.success("Listing removed");
    setListings((ls) => ls.map((x) => (x.id === l.id ? { ...x, status: "REMOVED" } : x)));
  }

  return (
    <div className="space-y-2">
      {listings.map((l) => (
        <div key={l.id} className="card p-3 flex items-center justify-between text-sm">
          <div>
            <p className="font-mono">{l.departureAirport} &rarr; {l.destinationAirport}</p>
            <p className="text-xs text-ink/50">{l.owner?.username} ({l.owner?.email}) - {l.status}</p>
          </div>
          {l.status !== "REMOVED" && (
            <button className="text-xs text-alert underline" onClick={() => remove(l)}>Remove</button>
          )}
        </div>
      ))}
    </div>
  );
}

function Reports() {
  const [reports, setReports] = useState([]);
  useEffect(() => { api.get("/admin/reports").then((res) => setReports(res.data.reports)); }, []);

  async function resolve(r, status) {
    await api.patch(`/admin/reports/${r.id}`, { status });
    toast.success("Report updated");
    setReports((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)));
  }

  if (reports.length === 0) return <p className="text-ink/50 text-sm">No reports.</p>;

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div key={r.id} className="card p-3 text-sm">
          <p><strong>{r.reporter.username}</strong> reported {r.targetUser?.username || "a listing"}: {r.reason}</p>
          {r.details && <p className="text-ink/60 text-xs mt-1">{r.details}</p>}
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-ink/5 px-2 py-1 rounded-full">{r.status}</span>
            {r.status === "OPEN" && (
              <>
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => resolve(r, "DISMISSED")}>Dismiss</button>
                <button className="btn-primary py-1 px-3 text-xs" onClick={() => resolve(r, "RESOLVED")}>Resolve</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditLogs() {
  async function exportCsv() {
    const res = await api.get("/admin/audit-logs", { params: { format: "csv" }, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnvoy-audit-logs-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get("/admin/audit-logs").then((res) => setLogs(res.data.logs)); }, []);

  return (
    <div>
      <button className="btn-secondary mb-3" onClick={exportCsv}>Export CSV (for law enforcement requests)</button>
      <div className="space-y-1 max-h-[60vh] overflow-y-auto text-xs">
        {logs.map((l) => (
          <div key={l.id} className="card p-2 flex justify-between">
            <span>{l.action} - {l.targetType} {l.targetId ? `#${l.targetId.slice(0, 8)}` : ""}</span>
            <span className="text-ink/40">{new Date(l.createdAt).toLocaleString("en-GB")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("analytics");
  const tabs = [
    ["analytics", "Analytics", Analytics],
    ["users", "Users", Users],
    ["listings", "Listings", ListingsAdmin],
    ["reports", "Reports", Reports],
    ["logs", "Audit logs", AuditLogs],
  ];
  const Active = tabs.find(([key]) => key === tab)[2];

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 py-10 pb-24"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
    >
      <h1 className="text-2xl font-bold mb-6">Admin</h1>
      <div className="flex gap-2 mb-6 no-scrollbar overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button key={key}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${tab === key ? "bg-ink text-paper" : "bg-ink/5"}`}
            onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      <Active />
    </motion.div>
  );
}

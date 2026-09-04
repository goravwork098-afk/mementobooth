"use client";

import Link from "next/link";
import { ArrowRight, Camera, Heart, LogOut, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return <main className="dashboard-page"><nav className="dashboard-nav"><Link href="/" className="brand"><span className="brand-mark"><Heart size={17} fill="currentColor" /></span>Couple Photobooth</Link><div className="dashboard-user"><span className="avatar">A</span><span className="user-name">Alex</span><button className="icon-button" aria-label="Sign out"><LogOut size={17} /></button></div></nav><section className="welcome-panel"><div className="welcome-copy"><p className="eyebrow"><Sparkles size={14} /> your little corner</p><h1>Welcome, Alex.<br /><em>Ready for a moment?</em></h1><p>When your person is ready, your first private booth will be waiting here.</p><Link href="/" className="button">Create a booth <ArrowRight size={16} /></Link></div><div className="welcome-art"><div className="dash-heart"><Heart size={32} fill="currentColor" /></div><div className="dash-card"><Camera size={18} /><span>your next memory<br /><strong>starts with a hello</strong></span></div></div></section><section className="dashboard-empty"><div className="empty-icon"><Camera size={22} /></div><h2>No booths yet</h2><p>Create your first room and send the invite to your person.</p><Link href="/" className="text-link">Make our first booth <ArrowRight size={15} /></Link></section><footer className="dashboard-footer"><span>Private by design.</span><span>© 2026 Couple Photobooth</span></footer></main>;
}

"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import api, { getAbsUrl } from "../../lib/api";

import { auth } from "../../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Camera, Loader2, Briefcase, GraduationCap, Award } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [profession, setProfession] = useState("");

  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const res = await api.get(`/users/${u.uid}/profile`);
          const info = res.data.user_info || {};
          setDisplayName(info.display_name || u.displayName || "");
          setUsername(info.username || "");
          setHeadline(info.headline || "");
          setBio(info.bio || "");
          setWebsite(info.website || "");
          setLocation(info.location || "");
          setPhotoURL(info.photoURL || u.photoURL || "");
          setProfession(info.profession || "");
          setExperiences(info.experiences || []);
          setEducation(info.education || []);
          setSkills(info.skills || []);
        } catch (e) {
          console.error("Failed to load profile for edit", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await api.post(
        `/users/profile/photo?user_id=${user.uid}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setPhotoURL(res.data.photoURL);
      // Invalidate cache so Navbar and other components update immediately
      queryClient.invalidateQueries({ queryKey: ["userProfile", user.uid] });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await api.post("/users/profile/update", {
        user_id: user.uid,
        display_name: displayName,
        username,
        headline,
        bio,
        website,
        location,
        profession,
        experiences,
        education,
        skills
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile", user.uid] });
      router.push("/profile");
    } catch (e) {
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <div className="p-10 text-center">Please login to edit your profile.</div>;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/profile" className="flex items-center text-muted-foreground hover:text-foreground transition mb-2">
            <ArrowLeft size={18} className="mr-1" /> Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
        </div>

        <div className="glass-card rounded-xl p-8 border border-border space-y-8">

          {/* Photo Upload Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-secondary border-2 border-border shadow-lg">
                <img
                  src={getAbsUrl(photoURL)}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl text-white"
              >
                {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
              </button>
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                {isUploading ? "Uploading..." : "Change Profile Photo"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Display Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Headline</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="Ex-Founder, Learning Rust, Freelancer..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2 px-1">Appears below your name in your profile</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">About</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition h-32 resize-none"
                placeholder="Tell your story..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Location</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Website</label>
              <input
                type="url"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="https://yourwebsite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            {/* Profession / Role */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Current Profession / Title</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                placeholder="Software Engineer, Designer..."
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
            </div>

            <hr className="border-border my-8" />
            <h2 className="text-xl font-bold flex items-center mb-4"><Briefcase size={20} className="mr-2" /> Experience</h2>

            <div className="space-y-4">
              {experiences.map((exp, idx) => (
                <div key={idx} className="p-4 bg-secondary/30 rounded-xl border border-border relative">
                  <button
                    onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                  >
                    ×
                  </button>
                  <input className="w-full bg-transparent font-bold outline-none mb-1" value={exp.position} placeholder="Position" onChange={(e) => {
                    const newExp = [...experiences]; newExp[idx].position = e.target.value; setExperiences(newExp);
                  }} />
                  <input className="w-full bg-transparent text-sm text-foreground mb-2 outline-none" value={exp.company} placeholder="Company Name" onChange={(e) => {
                    const newExp = [...experiences]; newExp[idx].company = e.target.value; setExperiences(newExp);
                  }} />
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <input className="w-24 bg-transparent outline-none" placeholder="YYYY-MM" value={exp.start_date} onChange={(e) => {
                      const newExp = [...experiences]; newExp[idx].start_date = e.target.value; setExperiences(newExp);
                    }} />
                    <span>-</span>
                    <input className="w-24 bg-transparent outline-none" placeholder="Present" value={exp.end_date || ""} onChange={(e) => {
                      const newExp = [...experiences]; newExp[idx].end_date = e.target.value; setExperiences(newExp);
                    }} />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setExperiences([...experiences, { company: "", position: "", start_date: "" }])}
                className="text-primary text-sm font-semibold flex items-center mt-2 hover:underline"
              >
                + Add Experience
              </button>
            </div>

            <hr className="border-border my-8" />
            <h2 className="text-xl font-bold flex items-center mb-4"><GraduationCap size={20} className="mr-2" /> Education</h2>

            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-secondary/30 rounded-xl border border-border relative">
                  <button
                    onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                  >
                    ×
                  </button>
                  <input className="w-full bg-transparent font-bold outline-none mb-1" value={edu.school} placeholder="School / University" onChange={(e) => {
                    const newEdu = [...education]; newEdu[idx].school = e.target.value; setEducation(newEdu);
                  }} />
                  <div className="flex gap-2">
                    <input className="w-full bg-transparent text-sm text-foreground outline-none" value={edu.degree || ""} placeholder="Degree" onChange={(e) => {
                      const newEdu = [...education]; newEdu[idx].degree = e.target.value; setEducation(newEdu);
                    }} />
                    <input className="w-full bg-transparent text-sm text-foreground outline-none" value={edu.field || ""} placeholder="Field of Study" onChange={(e) => {
                      const newEdu = [...education]; newEdu[idx].field = e.target.value; setEducation(newEdu);
                    }} />
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground mt-2">
                    <input className="w-24 bg-transparent outline-none" placeholder="YYYY" value={edu.start_date} onChange={(e) => {
                      const newEdu = [...education]; newEdu[idx].start_date = e.target.value; setEducation(newEdu);
                    }} />
                    <span>-</span>
                    <input className="w-24 bg-transparent outline-none" placeholder="YYYY" value={edu.end_date || ""} onChange={(e) => {
                      const newEdu = [...education]; newEdu[idx].end_date = e.target.value; setEducation(newEdu);
                    }} />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setEducation([...education, { school: "", start_date: "" }])}
                className="text-primary text-sm font-semibold flex items-center mt-2 hover:underline"
              >
                + Add Education
              </button>
            </div>

            <hr className="border-border my-8" />
            <h2 className="text-xl font-bold flex items-center mb-4"><Award size={20} className="mr-2" /> Skills</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill, idx) => (
                <div key={idx} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-2">
                  <span className="font-semibold text-sm">{skill.name}</span>
                  <button
                    onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                    className="text-primary hover:text-red-500 font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id="newContextSkill"
                className="px-4 py-2 rounded-xl bg-secondary/50 border border-border flex-1 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="E.g. React, Python, Product Management"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val && !skills.find(s => s.name === val)) {
                      setSkills([...skills, { name: val }]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('newContextSkill') as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !skills.find(s => s.name === val)) {
                    setSkills([...skills, { name: val }]);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-secondary text-foreground rounded-xl font-bold hover:brightness-110"
              >
                Add
              </button>
            </div>

            <hr className="border-border my-8" />

            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:brightness-110 shadow-lg shadow-primary/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {isSaving ? "Saving..." : <><Save size={20} /> Save Changes</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

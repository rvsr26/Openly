"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import { getAbsUrl } from "../lib/api";

interface ResumeGeneratorProps {
    user: any;
}

export default function ResumeGenerator({ user }: ResumeGeneratorProps) {
    const resumeRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!resumeRef.current) return;
        setIsGenerating(true);
        toast.info("Generating your resume...", { duration: 2000 });

        try {
            // Give time for layout
            await new Promise(r => setTimeout(r, 500));

            const blob = await toBlob(resumeRef.current, {
                quality: 0.95,
                backgroundColor: "#ffffff",
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: '800px',
                    height: 'auto'
                }
            });

            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${user.display_name?.replace(/\s+/g, '_')}_Resume.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Resume downloaded successfully!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate resume image.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!user) return null;

    return (
        <>
            <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{isGenerating ? "Exporting..." : "Export Resume"}</span>
            </button>

            {/* Hidden Resume Template (rendered offscreen for html-to-image) */}
            <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
                <div
                    ref={resumeRef}
                    className="w-[800px] bg-white text-black p-12 font-sans"
                    style={{ minHeight: '1130px' }} // Approx A4 ratio
                >
                    {/* Header */}
                    <div className="flex items-center gap-6 border-b-2 border-gray-200 pb-8 mb-8">
                        {user.photoURL && (
                            <img src={getAbsUrl(user.photoURL)} className="w-24 h-24 rounded-full object-cover" alt="Profile" />
                        )}
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-1">{user.display_name}</h1>
                            {user.profession && <h2 className="text-xl font-bold text-blue-600 mb-2">{user.profession}</h2>}
                            <div className="flex gap-4 text-sm text-gray-600">
                                {user.location && <span>📍 {user.location}</span>}
                                {user.website && <span>🔗 {user.website}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3 uppercase tracking-wider">About</h3>
                            <p className="text-gray-700 leading-relaxed text-sm">{user.bio}</p>
                        </div>
                    )}

                    {/* Experience */}
                    {user.experiences && user.experiences.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Experience</h3>
                            <div className="space-y-6">
                                {user.experiences.map((exp: any, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-gray-900">{exp.position}</h4>
                                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{exp.start_date} - {exp.current ? "Present" : exp.end_date}</span>
                                        </div>
                                        <h5 className="text-sm font-semibold text-gray-600 mb-2">{exp.company}</h5>
                                        {exp.description && <p className="text-sm text-gray-700 leading-relaxed">{exp.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {user.education && user.education.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Education</h3>
                            <div className="space-y-4">
                                {user.education.map((edu: any, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-gray-900">{edu.school}</h4>
                                            <span className="text-sm font-semibold text-gray-500">{edu.start_date} - {edu.end_date || "Present"}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {user.skills && user.skills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill: any, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-md">
                                        {skill.name} {skill.endorsements > 0 && `(${skill.endorsements})`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

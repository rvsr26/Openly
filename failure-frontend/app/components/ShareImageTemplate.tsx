"use client";

import React from "react";
import { Post } from "../types";
import { format } from "date-fns";
import { getAbsUrl } from "../lib/api";

interface ShareImageTemplateProps {
    post: Post;
}

const ShareImageTemplate = React.forwardRef<HTMLDivElement, ShareImageTemplateProps>(
    ({ post }, ref) => {
        const formattedDate = post.created_at
            ? format(new Date(post.created_at), "MMMM do, yyyy")
            : "Contributor";

        return (
            <div
                ref={ref}
                style={{
                    width: "800px",
                    height: "800px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                    padding: "60px",
                    fontFamily: "'Inter', sans-serif",
                    position: "fixed",
                    left: "-9999px",
                    top: "-9999px",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "40px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        padding: "50px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        color: "white",
                    }}
                >
                    {/* TOP SECTION: LOGO & CATEGORY */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img
                                src="/assets/logo.png"
                                alt="Openly"
                                crossOrigin="anonymous"
                                style={{ height: "45px", width: "auto", objectFit: "contain" }}
                            />
                        </div>
                        <div
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                padding: "8px 16px",
                                borderRadius: "30px",
                                fontSize: "14px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                            }}
                        >
                            {post.category || "Life"}
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p
                            style={{
                                fontSize: "36px",
                                fontWeight: "600",
                                textAlign: "center",
                                lineHeight: "1.4",
                                margin: 0,
                                display: "-webkit-box",
                                WebkitLineClamp: 8,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                        >
                            "{post.content}"
                        </p>
                    </div>

                    {/* BOTTOM SECTION: AUTHOR & DATE */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                            paddingTop: "30px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            <img
                                src={getAbsUrl(
                                    post.is_anonymous
                                        ? "/assets/anonymous.png"
                                        : post.user_pic || post.author_pic
                                )}
                                alt=""
                                crossOrigin="anonymous"
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    border: "3px solid rgba(255, 255, 255, 0.3)",
                                    objectFit: "cover",
                                }}
                            />
                            <div>
                                <div style={{ fontSize: "20px", fontWeight: "700" }}>
                                    {post.is_anonymous
                                        ? "Anonymous Contributor"
                                        : post.user_name || post.username || "Contributor"}
                                </div>
                                <div style={{ fontSize: "14px", opacity: 0.8 }}>Shared on Open Space</div>
                            </div>
                        </div>
                        <div style={{ textAlign: "right", opacity: 0.7, fontSize: "14px" }}>
                            {formattedDate}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

ShareImageTemplate.displayName = "ShareImageTemplate";

export default ShareImageTemplate;

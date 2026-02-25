"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import api, { uploadImage, getAbsUrl } from "../lib/api";
import { Image as ImageIcon, X, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { PollCreateData } from "../components/PollBuilder";

import { auth } from "../firebase";
import CreatePost from "../components/CreatePost";

const MAX_CHARS = 500;

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramCommunityId = searchParams.get("community") || null;
  const communityName = searchParams.get("community_name") || null;

  const [communityId, setCommunityId] = useState<string | null>(paramCommunityId);

  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // New props for CreatePost component
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isProfessionalInquiry, setIsProfessionalInquiry] = useState(false);
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [pollData, setPollData] = useState<PollCreateData | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSaveDraft = async () => {
    console.log("Saving draft...");
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    setError("");

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    if (content.length < 10) {
      setError("Post should be at least 10 characters");
      return;
    }

    if (content.length > MAX_CHARS) {
      setError(`Post cannot exceed ${MAX_CHARS} characters`);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    const userName =
      user.displayName && user.displayName.trim().length > 0
        ? user.displayName
        : "Anonymous";

    setLoading(true);

    try {
      await api.post("/posts/", {
        user_id: user.uid,
        user_name: userName,
        user_pic: user.photoURL || null,
        content: content.trim(),
        is_anonymous: anonymous,
        image_url: imageUrl,
        timeline_id: selectedTimelineId,
        collaborators: collaborators,
        is_professional_inquiry: isProfessionalInquiry,
        hubs: selectedHubs,
        poll: pollData || undefined,
        // Community targeting
        ...(communityId ? { community_id: communityId } : {}),
      });

      // Redirect back to community if posting from one
      if (communityId) {
        // Try to find slug from API or just go to communities
        router.push("/communities");
      } else {
        router.push("/feed");
      }
    } catch (err: unknown) {
      console.error("CREATE POST ERROR:", err);

      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20 max-w-3xl mx-auto px-4">
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-xl mb-6 text-sm text-center font-medium">{error}</div>}
      <CreatePost
        user={auth.currentUser}
        userPhoto={auth.currentUser?.photoURL || undefined}
        content={content}
        setContent={setContent}
        isAnonymous={anonymous}
        setIsAnonymous={setAnonymous}
        handleSubmit={handleSubmit}
        handleSaveDraft={handleSaveDraft}
        loading={loading}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        selectedTimelineId={selectedTimelineId}
        setSelectedTimelineId={setSelectedTimelineId}
        collaborators={collaborators}
        setCollaborators={setCollaborators}
        isProfessionalInquiry={isProfessionalInquiry}
        setIsProfessionalInquiry={setIsProfessionalInquiry}
        selectedHubs={selectedHubs}
        setSelectedHubs={setSelectedHubs}
        pollData={pollData}
        setPollData={setPollData}
        communityId={communityId}
        setCommunityId={setCommunityId}
      />
    </main>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <CreatePostContent />
    </Suspense>
  );
}


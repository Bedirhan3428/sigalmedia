import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../apiConfig';

const StoryContext = createContext();

export const useStories = () => useContext(StoryContext);

export const StoryProvider = ({ children }) => {
  const user = useAuth();
  const [stories, setStories] = useState([]); // Array of latest story from each following user
  const [myStory, setMyStory] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStories = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const followRes = await fetch(`${API_URL}/api/following-ids/${user.uid}`);
      const followData = await followRes.json();
      const followingIds = followData.followingIds || [];

      // Fetch latest story for each following user
      const results = await Promise.all(
        followingIds.map(uid =>
          fetch(`${API_URL}/api/my-tweets/${uid}`)
            .then(r => r.json())
            .then(tweets => {
              if (!Array.isArray(tweets)) return null;
              const since = Date.now() - 24 * 60 * 60 * 1000;
              const userStories = tweets.filter(t => 
                t.mediaType === 'story' && new Date(t.createdAt) > since
              );
              return userStories.length ? userStories[0] : null;
            })
            .catch(() => null)
        )
      );

      const activeStories = results.filter(Boolean);
      setStories(activeStories);

      // Fetch own story
      const myRes = await fetch(`${API_URL}/api/my-tweets/${user.uid}`);
      const myTweets = await myRes.json();
      if (Array.isArray(myTweets)) {
        const since = Date.now() - 24 * 60 * 60 * 1000;
        const myLatest = myTweets.find(t => t.mediaType === 'story' && new Date(t.createdAt) > since);
        setMyStory(myLatest || null);
      }
    } catch (err) {
      console.error("Story fetching error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchStories();
    // Poll every 5 minutes
    const interval = setInterval(fetchStories, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  const viewStory = async (storyId) => {
    if (!user?.uid) return;
    try {
      await fetch(`${API_URL}/api/tweet/${storyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: user.uid }),
      });
      // Update local state to reflect viewed status if needed
      setStories(prev => prev.map(s => 
        s._id === storyId ? { ...s, viewers: [...(s.viewers || []), user.uid] } : s
      ));
      if (myStory?._id === storyId) {
        setMyStory(prev => ({ ...prev, viewers: [...(prev.viewers || []), user.uid] }));
      }
    } catch (err) {
      console.error("Error viewing story:", err);
    }
  };

  const deleteStory = async (storyId) => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API_URL}/api/tweet/${storyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: user.uid }),
      });
      if (res.ok) {
        if (myStory?._id === storyId) setMyStory(null);
        setStories(prev => prev.filter(s => s._id !== storyId));
        return true;
      }
    } catch (err) {
      console.error("Error deleting story:", err);
    }
    return false;
  };

  const getStoryStatus = (userId) => {
    if (userId === user?.uid) {
      if (!myStory) return 'none';
      const isViewed = myStory.viewers?.includes(user.uid);
      return isViewed ? 'viewed' : 'active';
    }
    const story = stories.find(s => s.authorId === userId);
    if (!story) return 'none';
    const isViewed = story.viewers?.includes(user.uid);
    return isViewed ? 'viewed' : 'active';
  };

  return (
    <StoryContext.Provider value={{ 
      stories, 
      myStory, 
      loading, 
      fetchStories, 
      viewStory, 
      deleteStory,
      getStoryStatus 
    }}>
      {children}
    </StoryContext.Provider>
  );
};

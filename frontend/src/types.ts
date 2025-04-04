/**
 * Interface representing a post object
 */
export interface Post {
    _id: string;
    text: string;
    image?: string;
    createdAt: string;
    likes: string[]; // array of user IDs
    comments: {
      _id: string;
      text: string;
      user: string;
    }[];
    author: {
      _id: string;
      username: string;
      profilePicture?: string;
    };
}

export interface UserProfile {
    _id: string;
    username: string;
    bio: string;
    interests: string[];
    profilePicture: string;
    createdAt: string;
    updatedAt: string;
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
}

export interface UserStatsObj {
    postCount: number;
    followersCount: number;
    followingCount: number;
}
  
  
  
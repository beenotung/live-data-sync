export interface User {
  data: {
    username: string
  }
  ref: {
    authorOf: Set<Post>
    liked: Set<Like>
    reported: Set<Report>
  }
}

export interface Post {
  data: {
    content: string
    timestamp: number
  }
  ref: {
    author: User
    likedBy: Set<Like>
    replyTo?: Post
    prevPost: Post
    nextPost: Set<Post>
    reportBy: Set<Report>
  }
}

export interface Report {
  data: {
    reason: string
    approved?: boolean
    rejected?: boolean
  }
  ref: {
    post: Post
    author: User
    admin?: User
  }
}

export interface Like {
  data: {
    timestamp: number
  }
  ref: {
    user: User
    post: Post
  }
}

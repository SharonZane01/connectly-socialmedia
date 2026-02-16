from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Post(models.Model):
    # Consolidated choices
    MEDIA_CHOICES = (
        ("image", "Image"),
        ("video", "Video"),
    )

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    
    # Fixed indentation and field definition
    media_url = models.URLField(max_length=500, default="")
    media_type = models.CharField(max_length=10, choices=MEDIA_CHOICES, default="image")
    
    caption = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Relationships
    liked_by = models.ManyToManyField(User, related_name="liked_posts", blank=True)
    saved_by = models.ManyToManyField(User, related_name="saved_posts", blank=True)

    def __str__(self):
        return f"{self.author.full_name} - {self.media_type}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.full_name} - {self.content[:20]}"

class Follow(models.Model):
    follower = models.ForeignKey(User, related_name="following", on_delete=models.CASCADE)
    following = models.ForeignKey(User, related_name="followers", on_delete=models.CASCADE)

    # Ensure a user can't follow the same person twice
    class Meta:
        unique_together = ('follower', 'following')
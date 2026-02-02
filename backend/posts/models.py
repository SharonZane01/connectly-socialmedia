from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    caption = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # NEW: Tracks exactly WHICH users liked the post
    liked_by = models.ManyToManyField(User, related_name='liked_posts', blank=True)

    def __str__(self):
        return f"{self.author.full_name} - {self.caption[:20]}"
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from posts.models import Post, Comment
from users.models import User
from .models import Notification

# 1. Notify on Like (Many-to-Many change)
@receiver(m2m_changed, sender=Post.liked_by.through)
def notify_on_like(sender, instance, action, pk_set, **kwargs):
    if action == 'post_add': # When a like is ADDED
        for user_id in pk_set:
            liker = User.objects.get(pk=user_id)
            if liker != instance.author: # Don't notify if I like my own post
                Notification.objects.create(
                    sender=liker,
                    receiver=instance.author,
                    notification_type='like',
                    content_object=instance,
                    text=f"{liker.username} liked your post."
                )

# 2. Notify on Comment
@receiver(post_save, sender=Comment)
def notify_on_comment(sender, instance, created, **kwargs):
    if created and instance.author != instance.post.author:
        Notification.objects.create(
            sender=instance.author,
            receiver=instance.post.author,
            notification_type='comment',
            content_object=instance.post,
            text=f"{instance.author.username} commented: {instance.content[:30]}..."
        )

# 3. Notify on Follow
# (We need to check your User model structure for this, usually strictly M2M)
# We can add this later once Likes/Comments are working.
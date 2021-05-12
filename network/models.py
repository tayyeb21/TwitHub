from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    def __str__(self):
        return f"{self.first_name} {self.last_name} "
    

class Posts(models.Model):
    poster = models.ForeignKey(User, on_delete=models.PROTECT, related_name="poster")
    content = models.TextField()
    likes = models.ManyToManyField(User, related_name="likes")
    dateofpost = models.DateTimeField(auto_now_add=True)
    def serialize(self, username):
        print(self.dateofpost)
        isLiked = False
        allLikes = self.likes.all()
        for user in allLikes:
            if username == user.username:
                isLiked = True;
        return {
            "id"        : self.id,
            "poster"    : self.poster.username,
            "content"   : self.content,
            "timestamp" : self.dateofpost,
            "likesCount": self.likes.count(),
            "likes"     : [user.username for user in allLikes],
            "isLiked"   : isLiked
        }
class Followers(models.Model):
    accountuser = models.ForeignKey(User, on_delete=models.CASCADE, related_name="accountuser")
    # follower    = models.ManyToManyField(User, related_name="userFollowing")
    following   = models.ManyToManyField(User, related_name="userFollower")
    def serializeFollower(self):
        print(self.accountuser.all())
        return {    
            "followersCount": self.count(),
            "followers": [follower.username for follower in self.follower.all()],
        }
    def serializeFollowing(self):
        print(self.following.all())
        return {
            "followingCount": self.following.count(),
            "followings": [following.username for following in self.following.all()],
            }

from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    path("allpost", views.allPost, name="allpost"),
    path("followingposts", views.followingPosts, name="followingposts"),
    path("post", views.post, name="createPost"),
    path("following", views.following, name="createPost"),
    path("myprofile", views.myProfile, name="myprofile"),
    path("viewprofile/<str:username>", views.viewProfile, name="viewprofile"),
    path("follower/<str:username>", views.followerDetails, name="follower"),
    path("following/<str:username>", views.followingDetails, name="following"),
    path("bulkdata", views.bulkData, name="bulkdata"),
]

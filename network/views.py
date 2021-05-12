import json
import csv
from random import shuffle, randint
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from itertools import chain

from .models import User, Posts, Followers


def index(request):
    if request.user.is_authenticated:
        return render(request, "network/index.html")
    else:
        return HttpResponseRedirect(reverse('login'))

@login_required
def followingPosts(request):
    if request.method == "GET":
        posts = Posts.objects.none()
        follow = Followers.objects.get(accountuser=request.user)
        followings = follow.following.all()
        if not followings:
            return JsonResponse({"message": "No following its time to socialize" })
        
        for following in followings:
            followingPost = Posts.objects.filter(poster=following)
            posts = posts.union(followingPost)

        if not posts:
            return JsonResponse({"message": "No Posts yet"})

        posts = posts.order_by("-dateofpost").all()
        page_number = int(request.GET.get("page", 1), 10)
        paginator = Paginator(posts, 10)
        try:
            postObjects = paginator.page(page_number)
        except PageNotAnInteger:
            postObjects = paginator.page(1)
        except EmptyPage:
            if(page_number < 1):
                postObjects = paginator.page(1)
            return JsonResponse({"endofposts": "You're all caught up"})

        return JsonResponse([post.serialize(request.user.username) for post in postObjects], safe=False)

@login_required
def allPost(request):
    if request.method == "GET":
        posts = Posts.objects.all()
        if not posts:
            return JsonResponse({"error": "No posts Found"})
        else:
            posts = posts.order_by("-dateofpost").all()
            paginator = Paginator(posts, 10)
            page_number = int(request.GET.get("page", 1), 10)
            try:
                postObjects = paginator.page(page_number)
            except PageNotAnInteger: 
                postObjects = paginator.page(1)
            except EmptyPage:
                if page_number < 1:
                    postObjects = paginator.page(1)
                else:
                    return JsonResponse({"endofposts": "You're all caught up"})    
            
            return JsonResponse([post.serialize(request.user.username) for post in postObjects], safe=False)

@login_required
def post(request):
    if request.user.is_authenticated:
        if request.method == "POST":
                newPost = request.POST["newPost"]
                if newPost == "":
                    return JsonResponse({"error": "Post cannot be null"}, status=406)
                post = Posts(
                    poster = request.user,
                    content = newPost
                )
                print(post)
                post.save()
                return JsonResponse({"success": "Your amazing post is been created"})
        
        elif request.method == "PUT": 
            data = json.loads(request.body)
            if data.get("postid") is not None:
                post = Posts.objects.get(pk=data.get("postid"))
                if data.get("operation"):
                    if data.get("operation") == "updatelike":
                        if request.user in post.likes.all():
                            post.likes.remove(request.user)
                        else:
                            post.likes.add(request.user)
                    if(data.get("operation") == "updatepost"):
                        # print(data.get("content"))
                        if(post.poster.username == request.user.username):
                            post.content = data.get("content")
                            post.save()
                        else:
                            return HttpResponse(status=401)
                    return HttpResponse(status=204)
        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
    else:
        return JsonResponse({"error": "Please Login first"}, status=401)   
        

@login_required
def viewProfile(request, username):
    if request.method == "GET":
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": f"User with {username} doesnot exist"},status=400)
        userFollower = Followers.objects.get(accountuser=user)
        print(userFollower.following.all())
        posts = Posts.objects.filter(poster=user)
        posts = posts.order_by('-dateofpost')
        page_number = int(request.GET.get("page", 1), 10)
        paginator = Paginator(posts, 10)
        try:
            postObjects = paginator.page(page_number)
        except PageNotAnInteger:
            postObjects = paginator.page(1)
        except EmptyPage:
            if(page_number < 1):
                postObjects = paginator.page(1)

            return JsonResponse({"endofposts": "You're all caught up"})
        # print("hello");
        isFollowing = False
        for follower in user.userFollower.all():
            if follower.accountuser.username == request.user.username:
                isFollowing = True
        return JsonResponse({
            "username": username,
            "followercount" : user.userFollower.count(),
            "followingcount": userFollower.following.count(),
            "isFollowing" : isFollowing,
            "postcount": posts.count(),
            "posts": [post.serialize(request.user.username) for post in postObjects]
            })  

@login_required
def myProfile(request):
    if request.method == "GET":
        user = User.objects.get(username=request.user.username)
        follower = Followers.objects.get(accountuser=user)
        posts = Posts.objects.filter(poster=user)
        posts = posts.order_by('-dateofpost')
        page_number = int(request.GET.get("page", 1), 10)
        paginator = Paginator(posts, 10)
        try:
            postObjects = paginator.page(page_number)
        except PageNotAnInteger:
            postObjects = paginator.page(1)
        except EmptyPage:
            if(page_number < 1):
                postObjects = paginator.page(1)
            return JsonResponse({"endofposts": "You're all caught up"})
        
        return JsonResponse({
            "username": request.user.username,
            "followercount" : user.userFollower.count(),
            "followingcount": follower.following.count(),
            "postcount": posts.count(),
            "posts": [post.serialize(request.user.username) for post in postObjects]
        })


def following(request):
    if request.method == "PUT":
        if(request.user.is_authenticated):
            data = json.loads(request.body)
            if data["username"] is not None:   
                username = data["username"]
                print(request.user.username == username)
                print(request.user.username is username)
                if request.user.username == username:
                    return JsonResponse({"error": "No need to follow yourself"},status=400)
                try:
                    followingAccount = User.objects.get(username=username)
                except User.DoesNotExist:
                    return JsonResponse({"error": f"User with {username} doesnot exist"},status=400)
            else: 
                return JsonResponse({"error":"username required"}, status=400)
            userfollowing = Followers.objects.get(accountuser=request.user)
            if followingAccount in userfollowing.following.all():
                userfollowing.following.remove(followingAccount)
                userfollowing.save()
                return JsonResponse({"unfollow": "Unfollow success"}, status=200)
            else:
                userfollowing.following.add(followingAccount)
                userfollowing.save()
                return JsonResponse({"follow": "following success"}, status=200)
        else:
            return JsonResponse({"error":"Authentication required"}, status=401)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)
        



@login_required
def followerDetails(request, username):
    if request.method == "GET":
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": f"User with {username} doesnot exist"},status=400)
        # followers = Followers.objects.get(accountuser=user)
        # print(followers)
        return JsonResponse({
            "followersCount": user.userFollower.count(),
            "followers": [follower.accountuser.username for follower in user.userFollower.all()]
            }, safe=False)

def followingDetails(request, username):
    if request.method == "GET":
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": f"User with {username} doesnot exist"},status=400)

        followings = Followers.objects.get(accountuser=user)
        return JsonResponse(followings.serializeFollowing(), safe=False)     

def updateLike(request, post):
    pass

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
            
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            name = request.POST['fullname'].split()
            if len(name) > 1:
                user.first_name = name[0].capitalize()
                user.last_name = " ".join(name[1:]).capitalize()
            else:
                user.first_name = " ".join(name).capitalize()
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        
        follower = Followers(accountuser=user);
        follower.save()
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def bulkData(request):
    users = open("data.csv")
    buffer = csv.reader(users);
    next(buffer)
    count = 0;
    username = [];
    users = User.objects.all()
    for user in users:
        username.append(user.username)
        shuffle(username)
        n1 = randint(0, len(username) - 1)
        n2 = randint(0, len(username) - 1)
        followingAccount = User.objects.get(username=username[n1])
        userObj = User.objects.get(username = username[n2])
        if user.username == username[n2]:
            continue
        userfollowing = Followers.objects.get(accountuser=user)
        if followingAccount in userfollowing.following.all():
            continue
            
        else:
            userfollowing.following.add(followingAccount)
            userfollowing.save()
        count += 1
    
    """
    for first_name, last_name, _, _, _, _, _, _, phone1, _, email, _ in buffer:
        username = f"{first_name.lower()}{phone1[8:]}"
        password = "admin"
        try:
            user = User.objects.create_user(first_name = first_name, last_name = last_name,  username = username, password = password, email = email)
            user.save()
            follower = Followers(accountuser=user);
            follower.save()
            count += 1
        except IntegrityError:
            continue
    for user in users:
        username.append(user.username)
    for _, text, _ in buffer:
        shuffle(username)
        usr = User.objects.get(username = username[0])
        post = Posts(
            poster = usr,
            content = text
        )
        print(post)
        post.save()
        count += 1
        """
        
    return HttpResponse(f"{count} Users created successfully")

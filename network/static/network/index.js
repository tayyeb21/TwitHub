let menu = "allpost"
let page = 1;
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#postform").onsubmit = () => {
    addPost();
    return false;
  };
  document.querySelector("#allPost").addEventListener("click", () => {
    menu = "allpost";
    allPost(true);
  });
  document.querySelector("#follower-show").addEventListener("click", () => {
    followerDetail(document.querySelector("#profileName").innerHTML);
  });
  document.querySelector("#following-show").addEventListener("click", () => {
    followingDetail(document.querySelector("#profileName").innerHTML);
  });
  document.querySelector("#myProfile").addEventListener("click", () => {
    menu = "myprofile";
    myProfile(true);
  });
  document.querySelector("#following").addEventListener("click", () => {
   menu = "following";
   followingPosts(true);
  });
  
  allPost(true);

  window.onscroll = (e) => {
    if((window.innerHeight + window.scrollY) >= document.body.offsetHeight){
      
      if(page == 0)
        return;
        if(menu == "allpost"){
          page++;
          allPost();
        }
        if(menu == "viewprofile"){
          page++;
          // console.log(localStorage.getItem("viewprofile_username"));
          if(localStorage.getItem("viewprofile_username"))
            viewProfile(localStorage.getItem("viewprofile_username"));
        }
        if(menu == "myprofile"){
          page++;
          myProfile();
        }
        if(menu == "following"){
          page++;
          followingPosts();
        }

    }
  }
});

function allPost(reset = false) {
  // console.log(page);
  if (reset) {
    page = 1;
    document.querySelector("#posts").innerHTML = "";
    document.querySelector("#no-posts").innerHTML = "";
    window.scrollTo(0, 0);
  }
  if (page == 0) {
    document.querySelector("#no-posts").innerHTML = "You're All caught up";
    return;
  }
  document.querySelector("#heading").style.display = "block";
  document.querySelector("#heading").innerHTML = "All Posts";
  document.querySelector("#newPost").style.display = "block";
  document.querySelector("#profile").style.display = "none";
  const postLoader = document.querySelector("#post-loader");
  postLoader.style.display = "block";
  changeActive("allPost");
  fetch(`/allpost?page=${page}`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      // const post_template = Handlebars.compile(document.querySelector("#post").innerHTML);
      if (data.endofposts) {
        document.querySelector("#no-posts").innerHTML = data.endofposts;
        document.querySelector("#post-loader").style.display = "none";
        page = 0;
        return;
      }
      document.querySelector("#post-loader").style.display = "block";
      data.forEach((element) => {
        // let timestamp = new Date(element.timestamp);
        // timestamp = timestamp.toLocaleString("en-US", { month: "long", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        // const posts = post_template({ poster: element.poster, content: element.content, timestamp: timestamp, isLiked: element.isLiked, likeCount: element.likesCount });
        // document.querySelector("#posts").innerHTML += posts;
        createPostsElements(element, false);
        // document.querySelector("#likebtn").onclick =  (event) => updateLike(event.target, element.id);
      });
      document.querySelector("#post-loader").style.display = "none";
    });
}

function viewProfile(username, reset = false) {
  menu = "viewprofile";
  /* console.log(reset)
  console.log(page);  */ 
  if(reset){
    page = 1;
    document.querySelector("#posts").innerHTML = "";
    document.querySelector("#no-posts").innerHTML = "";
    localStorage.setItem("viewprofile_username", username);
    window.scrollTo(0, 0);
  }
  if (page == 0) {
    return;
  }
  document.querySelector("#heading").style.display = "none";
  fetch(`/viewprofile/${username}?page=${page}`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      page++;
      if (data.endofposts) {
        document.querySelector("#post-loader").style.display = "none";
        page = 0;
        return;
      }
      document.querySelector("#newPost").style.display = "none";
      document.querySelector("#profile").style.display = "block";
      document.querySelector("#profileName").innerHTML = data.username;
      document.querySelector("#post-count").innerHTML = data.postcount;
      document.querySelector("#followerCount").innerHTML = data.followercount;
      document.querySelector("#followingCount").innerHTML = data.followingcount;
      document.querySelector("#follow").style.display = "block";
      if (data.isFollowing) {
        document.querySelector("#follow").classList.remove("btn-post");
        document.querySelector("#follow").classList.add("btn-following");
        document.querySelector("#follow").innerHTML = "following";
      } else {
        document.querySelector("#follow").classList.remove("btn-following");
        document.querySelector("#follow").classList.add("btn-post");
        document.querySelector("#follow").innerHTML = '<i class="fas fa-plus"></i> follow';
      }
      document.querySelector("#follow").onclick = () => {
        following(data.username);
      };
      /* const post_template = Handlebars.compile(document.querySelector("#post").innerHTML); */
      if (data.posts.length < 1) {
        posts.innerHTML = '<h3 class="text-center mt-5"> No Posts Yet </h3>';
      }
      // posts.innerHTML = "";
      document.querySelector("#post-loader").style.display = "block";
      data.posts.forEach((element) => {
        /* let timestamp = new Date(element.timestamp);
        timestamp = timestamp.toLocaleString("en-US", { month: "long", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const posts = post_template({ poster: element.poster, content: element.content, timestamp: timestamp, isLiked: element.isLiked, likeCount: element.likesCount });
        document.querySelector("#posts").innerHTML += posts; */
        createPostsElements(element, true);
      });
      document.querySelector("#post-loader").style.display = "none";
    });
}
function myProfile(reset = false) {
  if (reset) {
    page = 1;
    document.querySelector("#posts").innerHTML = "";
    document.querySelector("#no-posts").innerHTML = "";
    window.scrollTo(0, 0);
  }
  if(page == 0)
    return;

  document.querySelector("#heading").style.display = "none";
  changeActive("myProfile");
  fetch(`/myprofile?page=${page}`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      if (data.endofposts) {
        document.querySelector("#post-loader").style.display = "none";
        page = 0;
        return;
      }
      document.querySelector("#newPost").style.display = "none";
      document.querySelector("#profile").style.display = "block";
      document.querySelector("#profileName").innerHTML = data.username;
      document.querySelector("#post-count").innerHTML = data.postcount;
      document.querySelector("#followerCount").innerHTML = data.followercount;
      document.querySelector("#followingCount").innerHTML = data.followingcount;
      document.querySelector("#follow").style.display = "none";
      if (data.posts.length < 1) {
        posts.innerHTML = '<h3 class="text-center mt-5"> No Posts Yet </h3>';
      }
      /* const post_template = Handlebars.compile(document.querySelector("#post").innerHTML); */
      document.querySelector("#post-loader").style.display = "block";
      data.posts.forEach((element) => {
        /* let timestamp = new Date(element.timestamp);
        timestamp = timestamp.toLocaleString("en-US", { month: "long", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const posts = post_template({ poster: element.poster, content: element.content, timestamp: timestamp, isLiked: element.isLiked, likeCount: element.likesCount });
        document.querySelector("#posts").innerHTML += posts; */
        createPostsElements(element, true);
      });
      document.querySelector("#post-loader").style.display = "none";
    });
}
function followingDetail(username) {
  fetch(`/following/${username}`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      createModalData(data);
      $("#follow-modal").modal();
    });
}
function followerDetail(username) {
  fetch(`/follower/${username}`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      createModalData(data);
      $("#follow-modal").modal();
    });
}
function followingPosts(reset = false) {
  if (reset) {
    page = 1;
    document.querySelector("#posts").innerHTML = "";
    document.querySelector("#no-posts").innerHTML = "";
    window.scrollTo(0, 0);
  }
  if(page == 0)
    return;
  changeActive("following");
  document.querySelector("#heading").style.display = "block";
  document.querySelector("#heading").innerHTML = "Your Following Posts";
  document.querySelector("#newPost").style.display = "none";
  document.querySelector("#profile").style.display = "none";
  document.querySelector("#post-loader").style.display = "block";
  fetch(`/followingposts?page=${page}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.endofposts) {
        document.querySelector("#no-posts").innerHTML = data.endofposts;
        document.querySelector("#post-loader").style.display = "none";
        page = 0;
        return;
      }
      // console.log(data);
      if (data.message) {
        document.querySelector("#post-loader").style.display = "none";
        document.querySelector("#posts").innerHTML = `<h3 class="text-center mt-5">${data.message}</h3>`;
        return;
      }
      data.forEach((element) => {
        createPostsElements(element, (isProfile = false));
      });
      page++;
      document.querySelector("#post-loader").style.display = "none";
    });
}

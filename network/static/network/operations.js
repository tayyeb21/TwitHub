function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
function addPost() {
  const newPost = new FormData(document.querySelector("#postform"));

  /* console.log(document.querySelector("#postform"));
     console.log(newPost); */
  fetch("/post", {
    method: "POST",
    body: newPost,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) alertify.error(data.error);
      else alertify.success(data.success);
      document.querySelector("#postform").reset();
      allPost(true);
    });
  return false;
}
function editPost(element, id, content){
  const parent = element.parentNode;
  const childs = parent.children;
  const csrftoken = getCookie("csrftoken")
  const textarea = document.createElement("textarea");
  const updatebtn = document.createElement("button");
  textarea.className = "form-control";
  textarea.value = content;
  updatebtn.className = "btn btn-post mt-1";
  updatebtn.innerHTML = "Update Post"
  // console.log(parent.children);
  let contentp;
  for(i=0; i<childs.length; i++){
    if(childs[i].id == "content"){
      contentp = childs[i];
      break;
    }
  }  
  // console.log(contentp);
  contentp.innerHTML = "";
  contentp.appendChild(textarea);
  contentp.appendChild(updatebtn);
  updatebtn.onclick = () => {
    fetch("/post", {
      method: "PUT",
      headers: {
        "X-CSRFToken": csrftoken
      },
      body: JSON.stringify({
        postid   : id,
        content  : textarea.value,
        operation: "updatepost"
      })
      
    })
    .then(response => {
      if(response.status == 204)
        alertify.success("Your amazing post is updated");
      else if(response.status == 401)
        alertify.error("Unauthorized user");
      else 
        alertify.warning("Something went wrong");

      contentp.innerHTML = textarea.value;
    })
  }
}
function following(username) {
  const followBtn = document.querySelector("#follow");
  // console.log(username);
  const csrftoken = getCookie("csrftoken");
  // console.log(csrftoken);
  fetch("/following", {
    method: "PUT",
    headers: {
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({
      username: username,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      if (data.follow) {
        // alertify.success(data.follow);
        followBtn.innerHTML = "following";
        followBtn.classList.remove("btn-post");
        followBtn.classList.add("btn-following");
        let followerCount = document.querySelector("#followerCount");
        let count = parseInt(followerCount.innerHTML);
        followerCount.innerHTML = ++count;
      } else {
        if (data.unfollow) {
          // alertify.warning(data.unfollow)
          followBtn.innerHTML = '<i class="fas fa-plus"></i> follow ';
          followBtn.classList.remove("btn-following");
          followBtn.classList.add("btn-post");
          let followerCount = document.querySelector("#followerCount");
          let count = parseInt(followerCount.innerHTML);
          followerCount.innerHTML = --count;
        } else if (data.error) alertify.error(data.error);
        else alertify.error("something went wrong");
      }
    });
}

/** Update the like on click of the icon button */
function updateLike(element, id) {
  // console.log(id);
  // console.log(element);

  const Likecount = element.parentNode.lastChild;
  // console.log(Likecount);
  let count = parseInt(Likecount.innerHTML);
  const parent = element.parentNode.firstChild;
  if (element.id === "likeicon") {
    element.style.animationPlayState = "running";
    element.id = "likedicon";
    element.className = "fas fa-heart like-icon";
    const newele = element.cloneNode(true);
    element.parentNode.replaceChild(newele, element);
    Likecount.innerHTML = ++count;
  } else {
    element.style.animationPlayState = "running";
    element.id = "likeicon";
    element.className = "far fa-heart like-icon";
    const newele = element.cloneNode(true);
    element.parentNode.replaceChild(newele, element);
    Likecount.innerHTML = --count;
  }
  fetch("/post", {
    method: "PUT",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({
      postid: id,
      operation: "updatelike"
    }),
  }).then((response) => {
    if (!response.status == 204) alertify.error("Something went wrong");
  });
}

function createPostsElements(data, isProfile) {
  const currentUser = JSON.parse(document.querySelector("#current-user").textContent);
  // console.log(currentUser);
  const postsElement = document.querySelector("#posts");

  let timestamp = new Date(data.timestamp);
  timestamp = timestamp.toLocaleString("en-US", { month: "long", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const carddiv = document.createElement("div");
  carddiv.className = "card mt-2";
  postsElement.appendChild(carddiv);

  const cardbodydiv = document.createElement("div");
  cardbodydiv.className = "card-body";
  carddiv.appendChild(cardbodydiv);

  const h5 = document.createElement("h5");
  let edit = null;
  if (data.poster === currentUser) {
    edit = document.createElement("button");
    edit.className = "btn btn-outline-primary btn-sm ";
    edit.innerHTML = '<i class="fas fa-pen"></i> edit';
    edit.addEventListener("click", (event) => editPost(edit, data.id, data.content))
  }
  if (!isProfile) {
    h5.className = "link";
    h5.innerHTML = data.poster;
    if (data.poster === currentUser) 
      h5.addEventListener("click", () => myProfile(true));
    else 
      h5.addEventListener("click", () => viewProfile(data.poster, true));
  } else {
    h5.innerHTML = data.poster;
  }

  const content = document.createElement("p");
  content.id = "content"
  content.innerHTML = data.content;

  const time = document.createElement("p");
  time.className = "text-muted";
  time.innerHTML = timestamp;

  const likeDiv = document.createElement("p");
  const likebtn = document.createElement("a");
  likebtn.id = "likebtn";
  likebtn.className = "btn";
  likebtn.addEventListener("click", (event) => updateLike(event.target, data.id));
  if (data.isLiked) likebtn.innerHTML = `<i id="likedicon" class="fas fa-heart like-icon" title="unlike"></i>`;
  else likebtn.innerHTML = `<i id="likeicon" class="far fa-heart like-icon" title="like"></i>`;

  likebtn.innerHTML += ` <span id="like-count" >${data.likesCount}</span>`;
  likeDiv.appendChild(likebtn);

  cardbodydiv.appendChild(h5);
  if (edit) 
    cardbodydiv.appendChild(edit);

  cardbodydiv.appendChild(content);
  cardbodydiv.appendChild(time);
  cardbodydiv.appendChild(likeDiv);
}

function createModalData(data) {
  const currentUser = JSON.parse(document.querySelector("#current-user").textContent);
  const table = document.querySelector("#followTable");
  table.innerHTML = "";
  // const p = document.createElement("p");
  if (data.followings) {
    if (data.followings.length > 0)
      data.followings.forEach((following) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        table.appendChild(tr);
        td.className = "link";
        td.innerHTML = following;
        tr.appendChild(td);
        tr.addEventListener("click", () =>{
          $("#follow-modal").modal('hide');
          console.log(currentUser == following)
          if(currentUser == following){
            myProfile(true);
          }
          else
            viewProfile(following, true)
        });
      });

    else {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      table.appendChild(tr);
      td.innerHTML = "No followings";
      tr.appendChild(td);
    }

  } 
  else {
    if (data.followers.length > 0)
      data.followers.forEach((follower) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        table.appendChild(tr);
        td.className = "link";
        td.addEventListener("click", () => {
          // console.log(follower)
          $("#follow-modal").modal('hide');
          if(currentUser == follower){
            myProfile(true);
          }
          else
            viewProfile(follower, true)
        });
        td.innerHTML = follower;
        tr.appendChild(td);
      });
    else {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      table.appendChild(tr);
      td.innerHTML = "No followers";
      tr.appendChild(td);
    }
  }
}

function changeActive(elementId) {
  const activeLink = document.querySelector(".nav-item.active");
  activeLink.classList.remove("active");
  /* // console.log( document.querySelector(`#${elementId}`));
    // console.log(document.querySelector(`#${elementId}`).parentNode.classList); */
  document.querySelector(`#${elementId}`).parentNode.classList.add("active");
}

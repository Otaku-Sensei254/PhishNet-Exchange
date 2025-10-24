import React from "react";
import "../Components/styles/posts.css";
const Post = () => {
  return (
    <div className="form-container">
      <div className="form-box">
        <form action="">
          <div className="content">
            <label htmlFor="content"></label>
            <textarea name="content" id="" placeholder="(e.g) Just received a phishing email pretending to be from PayPal. Be careful!">
              
            </textarea>
          </div>
          <div className="upload">
            <input type="file" name="images" id="" />
          </div>
          <a href="meeh" >download</a>
          <div className="tags">
            <p>Have your tags here<h5>#</h5></p>in 
          </div>
          <button>Upload </button>
        </form>
      </div>
    </div>
  );
};

export default Post;

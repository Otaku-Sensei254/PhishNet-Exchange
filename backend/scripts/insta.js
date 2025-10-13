import axios from "axios";

async function gatherInstaData(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

  // Replace these with your real cookies (grab from browser DevTools > Application > Cookies)
  const cookies = {
    sessionid: "45181285462%3AvLbQOoDBxggom5%3A25%3AAYcFUKfPIKXXrOpwkxCXCqs-PnT2OmfnQr7U3yEx8fFU",
    csrftoken: "BO8uC878gcVg5yAs7yKapWWoZxh5ypMv",
    mid: "aIuVvAALAAGHGHo4RQaldIqV9AdV",
    ig_did: "4C807942-EED1-4A09-9C5A-F5D7D0C20B52",
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "X-CSRFToken": cookies.csrftoken,
    "Cookie": `sessionid=${cookies.sessionid}; csrftoken=${cookies.csrftoken}; mid=${cookies.mid}; ig_did=${cookies.ig_did};`,
  };

  try {
    const response = await axios.get(url, { headers });
    if (response.status === 200 && response.data?.data?.user) {
      const user = response.data.data.user;
      return {
        Username: user.username,
        "Full Name": user.full_name,
        Bio: user.biography,
        "Profile Pic URL": user.profile_pic_url_hd,
        Posts: user.edge_owner_to_timeline_media?.count || 0,
        Followers: user.edge_followed_by?.count || 0,
        Following: user.edge_follow?.count || 0,
      };
    } else {
      console.error(`Error: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to gather data: ${error.message}`);
    return null;
  }
}

// Test
(async () => {
  const data = await gatherInstaData("kakura_tea");
  console.log(data);
})();

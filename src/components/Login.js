import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { setupAffectiva } from "../affectiva/affectiva";

import { getCurrentUser, setupAuthToAPI } from "../actions/user_actions";

import $ from "jquery";

const spotifyConfig = {
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  callbackURL: process.env.SPOTIFY_CALLBACK
};

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID
  ? process.env.SPOTIFY_CLIENT_ID.replace(/"/g, "")
  : require("../../secrets.js").spotifyClientId;
const spotifyRedirectURI = process.env.SPOTIFY_REDIRECT_URI
  ? process.env.SPOTIFY_REDIRECT_URI.replace(/"/g, "")
  : require("../../secrets.js").spotifyRedirectURI;

const scopes = [
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-top-read",
  "user-library-read",
  "user-library-modify",
  "user-follow-read",
  "user-follow-modify"
];
const client_id = spotifyClientId;
const redirect_uri = spotifyRedirectURI; //'http://localhost:8888/callback' // 'or the heroku app name'

const url =
  "https://accounts.spotify.com/authorize?client_id=" +
  client_id +
  "&redirect_uri=" +
  encodeURIComponent(redirect_uri) +
  "&scope=" +
  encodeURIComponent(scopes.join(" ")) +
  "&response_type=token";

const width = 450,
  height = 730,
  left = width / 2 - width / 2,
  top = height / 2 - height / 2;
class Login extends Component {
  state = {
    navClassName: "navbar-start"
  };
  componentDidMount() {
    window.addEventListener("message", e => this.auth(e), false);
  }
  auth = async event => {
    if (event.data.type == "access_token") {
      await this.props.setupAuthToAPI(event.data.access_token);
      await this.props.getCurrentUser();
      this.props.history.push("/app");
      this.props.setupAffectiva();
    }
  };
  login = () => {
    window.open(
      url,
      "Spotify",
      "menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=" +
        width +
        ", height=" +
        height +
        ", top=" +
        top +
        ", left=" +
        left
    );
  };

  render() {
    console.log(url);
    return (
      <div>
        <nav className="navbar ">
          <div className="navbar-brand">
            <NavLink className="navbar-item" to="/" />
            <a className="navbar-item" style={{ color: "white" }}>
              EBMP - Emotion Based Music Player
            </a>

            <a
              className="navbar-item is-hidden-desktop login-btn"
              onClick={() => this.login()}
              style={{ color: "white" }}
            >
              <span>Login</span>
            </a>
          </div>

          <div id="navMenubd-example" className="navbar-menu">
            <div className="navbar-end">
              <a onClick={() => this.login()} className="login-btn">
                <span>Login</span>
              </a>
            </div>
          </div>
        </nav>
      </div>

      // <div>
      //   <div>
      //     <h1>Emotion Based Music Player</h1>
      //     <hr/>
      //   </div>
      //   <button onClick={() => this.login()} className="btn btn-success">Login In</button>
      // </div>
    );
  }
}

export default withRouter(
  connect(null, { getCurrentUser, setupAuthToAPI, setupAffectiva })(Login)
);

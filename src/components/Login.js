import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { setupAffectiva } from '../affectiva/affectiva'

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
      // <div className="login-wrapper">
      //   <div>
      //     <nav className="navbar ">
      //       <div className="navbar-brand">
      //         <NavLink className="navbar-item" to="/">
      //           
      //         </NavLink>

      //         <a
      //           className="navbar-item is-hidden-desktop login-btn"
      //           onClick={() => this.login()}
      //           style={{ color: 'white' }}
      //         >
      //           <span>Login</span>
      //         </a>
      //       </div>

      //       <div id="navMenubd-example" className="navbar-menu">
      //         <div className="navbar-end">
      //           <a onClick={() => this.login()} className="login-btn">
      //             <span>Login</span>
      //           </a>
      //         </div>
      //       </div>
      //     </nav>
      //     <section className="wrapper">
      //       <div className="banner-info">
      //         <h1>Discover a universe of music</h1>
      //         <h1>Login now!</h1>
      //         <p>
      //           <a onClick={() => this.login()} className="banner-button">
      //             Login
      //           </a>
      //         </p>
      //         <p>
      //           <a
      //             onClick={() => this.login()}
      //             className="scroll-down"
      //             id="mini-info"
      //           >
      //  
      //           </a>
      //         </p>
      //         <br />
      //         <i
      //           className="fa fa-arrow-down scroll-down bounce"
      //           aria-hidden="true"
      //         />
      //       </div>
      //     </section>
      //     <section className="banner-two">
      //       <img src={require('../images/devices.png')} alt="devices" />
      //       <div className="banner-two-info">
      //       
      //         <h2 id="slide-two">Music</h2>
      //        
      //         <h2 id="slide-three">Playlists</h2>
      //         <p id="slide-three">
      //           You’ll find readymade playlists to match your mood, put together
      //           by music fans and experts.
      //         </p>
      //         <h2 id="slide-four">New releases</h2>
      //         <p id="slide-four">
      //           Hear the week's latest singles and albums, and check out what's
      //           hot in the Top 50.
      //         </p>
      //       </div>
      //     </section>
      //     <section className="banner-three">
      //       <i
      //         className="fa fa-arrow-down scroll-down-two"
      //         aria-hidden="true"
      //       />
      //       <div className="wrapper">
      //         <h1>Music for everyone.</h1>
      //         <p>
      //           <a
      //             onClick={() => this.login()}
      //             className="banner-button"
      //             href="#"
      //           >
      //             
      //           </a>
      //           <a
      //             onClick={() => this.login()}
      //             className="banner-button"
      //             href="#"
      //           >
      //     
      //           </a>
      //         </p>
      //       </div>
      //     </section>
      //     <section className="banner-four">
      //       <i
      //         className="fa fa-arrow-down scroll-down-three"
      //         aria-hidden="true"
      //       />
      //       <div className="service-header">
      //         <h1>One account. Listen everywhere.</h1>
      //         <p>Mobile - Computer - Tablet - Web player - Car</p>
      //       </div>
      //       <div className="services">
      //         <div className="service-one">
      //           <h2>Search</h2>
      //           <p>
      //             Know what you want to listen to? Just search and hit play.
      //           </p>
      //         </div>
      //         <div className="service-two">
      //           <h2>Browse</h2>
      //           <p>
      //             Check out the latest charts, brand new releases and great
      //             playlists for right now.
      //           </p>
      //         </div>
      //         <div className="service-three">
      //           <h2>Discover</h2>
      //           <p>
      //             Enjoy new music every Monday with your own personal playlist.
      //             Or sit back and enjoy Radio.
      //           </p>
      //         </div>
      //       </div>
      //     </section>
      //     <footer>
      //       <div id="footer">
      //         <span className="slide">
      //           <i
      //             className="fa fa-facebook-square footicon"
      //             aria-hidden="true"
      //           />
      //           <i
      //             className="fa fa-linkedin-square footicon"
      //             aria-hidden="true"
      //           />
      //           <i className="fa fa-instagram footicon" aria-hidden="true" />
      //           <i
      //             className="fa fa-twitter-square footicon"
      //             aria-hidden="true"
      //           />
      //         </span>
      //       
      //       </div>
      //     </footer>
      //   </div>
      // </div>
      <div>
        <div>
          <h1>Emotion Based Music Player</h1>
          <hr/>
        </div>
        <button onClick={() => this.login()}>Login In</button>
      </div>
    );
  }
}

export default withRouter(
  connect(null, { getCurrentUser, setupAuthToAPI, setupAffectiva })(Login)
);

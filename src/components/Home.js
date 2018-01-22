import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
// import emotionClassifier from '../models/emotionclassifier';
// import emotionModel from '../models/emotionmodel';
// import pModel from '../models/pmodel';

import {
  getPlaylists,
  getPrivatePlaylists,
  getFeaturedPlaylists,
  createPlaylist
} from "../actions/playlist_actions";

import { setActivePlaylist } from "../actions/playlist_actions";
import { setActiveTracklist } from "../actions/track_actions";
import Tracklist from "./Tracklist";
import Playlists from "./Playlists";
import ExtraInfolist from "./ExtraInfolist";
import CreateNewPlaylistModal from "./modals/CreateNewPlaylistModal";
import Loading from "./general/Loading";

//affectiva
import affectiva, {
  startAffectiva,
  processEmotion,
  setupAffectiva,
  stopAffectiva
} from "../affectiva/affectiva.js";
import { trackLookup } from "../actions/spotifyApi_actions";

class Home extends Component {
  constructor(props) {
    super(props);
  }
  state = {
    button: false,
    // startButton:false,
    modalClassName: "modal create-playlist-modal",
    playlistClassName: "column playlists-menu",
    renderEBMP: false
  };
  componentDidMount() {
    console.log("tokens", localStorage.getItem("token"));
    console.log("cdm", this.props);
    this.getAllPlaylists(this.props);
    window.scroll(0, 0);
  }
  async componentWillReceiveProps(newProps) {
    if (this.props.user !== newProps.user) {
      this.getAllPlaylists(newProps);
    }
  }

  getAllPlaylists = async newProps => {
    await this.props.getPlaylists(newProps.user.id);
    this.props.getPrivatePlaylists(this.props.playlists, newProps.user.id);
    this.props.getFeaturedPlaylists();
    if (this.props.playlists.length > 1) {
      this.setStandardPlaylist(this.props.playlists);
    }
  };
  setStandardPlaylist = playlists => {
    this.props.setActivePlaylist(playlists[0].id);
    this.props.setActiveTracklist(playlists[0].owner.id, playlists[0].id);
  };
  togglePlaylist = () => {
    if (this.state.playlistClassName === "column playlists-menu") {
      this.setState({ playlistClassName: "column playlists-menu active" });
    } else {
      this.setState({ playlistClassName: "column playlists-menu" });
    }
  };
  closeModal = () => {
    this.setState({ modalClassName: "modal create-playlist-modal" });
  };
  openModal = () => {
    this.setState({ modalClassName: "modal create-playlist-modal is-active" });
  };
  createPlaylist = async (name, desc) => {
    this.closeModal();
    await this.props.createPlaylist(this.props.user.id, name, desc);
    this.props.getPlaylists();
    this.props.getPrivatePlaylists();
  };
  renderTracklist = () => {
    return !this.props.activeTracklist || !this.props.activeTracklist.id ? (
      <Loading />
    ) : (
      <Tracklist />
    );
  };

  render() {
    console.log("props", this.props);
    return (
      <div>
        <div className="columns">
          <div className={this.state.playlistClassName}>
            <Playlists onOpenCreatePlaylistModal={this.openModal} />
          </div>
          <div className="column is-6 tracklist">
            {this.state.renderEBMP ? (
              <div>
                <div>
                  <div id="songs" />
                  <div id="song-display" />
                </div>
                <div />
              </div>
            ) : (
              this.renderTracklist()
            )}
          </div>
          <div className="column extra-infolist">
            <script src="https://download.affectiva.com/js/3.2/affdex.js" />
            <div className="column">
              <div className="ui card">
                <div id="login" className="content">
                  <h2 className="ui header center" id="header">
                    Please login with Spotify
                  </h2>
                  <div id="profile" className="running center">
                    <button
                      disabled={this.state.button}
                      className="ui button"
                      id="start"
                      onClick={() => {
                        Promise.all(
                          [setupAffectiva(), startAffectiva()],
                          this.setState({ button: !this.state.startButton }),
                          this.setState({ renderEBMP: true })
                        );
                      }}
                    >
                      Start Affectiva
                    </button>

                    <button
                      disabled={!this.state.button}
                      className="ui button"
                      id="stop"
                      onClick={() => {
                        stopAffectiva();
                        this.setState({ button: this.state.stopButton });
                        this.setState({ renderEBMP: false });
                      }}
                    >
                      Stop Affectiva
                    </button>

                    <button
                      className="ui button"
                      id="active"
                      onClick={() => processEmotion()}
                    >
                      Get a song!
                    </button>

                    <div className="column running">
                      <div
                        id="affdex_elements"
                        styles={{ width: "200px", height: "150 px" }}
                      />
                      <div className="running" styles={{ height: "5em" }}>
                        <h4>Emotion Tracking Results</h4>
                        <div id="results" />
                      </div>
                      <div className="running">
                        <h4>Console</h4>
                        <div id="logs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
          <script src="../affectiva/affectiva.js" />
        </div>
        <div className={this.state.modalClassName}>
          <CreateNewPlaylistModal
            createPlaylist={(name, desc) => this.createPlaylist(name, desc)}
            closeModal={this.closeModal}
          />
        </div>
        <div
          onClick={() => this.togglePlaylist()}
          style={{
            position: "fixed",
            top: "15px",
            left: "15px",
            zIndex: 999,
            color: "#bdbdbd"
          }}
          className="burger-menu-playlist"
        >
          <i
            style={{ fontSize: "1.5rem" }}
            className="fa fa-tasks"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ user, playlist, track }) => {
  return {
    user: user.user,
    playlists: playlist.playlists,
    privatePlaylists: playlist.privatePlaylists,
    featuredPlaylists: playlist.featuredPlaylists,
    activeTracklist: track.activeTracklist
  };
};

export default connect(mapStateToProps, {
  getPlaylists,
  getPrivatePlaylists,
  getFeaturedPlaylists,
  createPlaylist,
  setActivePlaylist,
  setActiveTracklist,
  startAffectiva,
  stopAffectiva,
  processEmotion
})(Home);

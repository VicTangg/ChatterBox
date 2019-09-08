import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import uuid from 'uuid';
import moment from 'moment';

import { Alert, Container, Row, Col} from 'reactstrap';
import { Button, Form, FormGroup, Label, InputGroup, Input } from 'reactstrap';
import { ListGroup, ListGroupItem } from 'reactstrap';
import { Spinner } from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.css';
import './App.css';

class EditUserInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      userDetail: null,
      processing: false
    };
  }

  componentDidMount() {
    this.setState({isLoading: true})
    axios.get('getuserinfo')
      .then(response => {
        console.log(response)
        this.setState(
          {
            userDetail: response.data,
            newMobileNumber: response.data.mobileNumber,
            newHomeNumber: response.data.homeNumber,
            newAddress: response.data.address,
            isLoading: false
          }
        )
      })
  }

  handleMobileNumberChange(e) {
    this.setState({newMobileNumber: e.target.value});
  }

  handleHomeNumberChange(e) {
    this.setState({newHomeNumber: e.target.value});
  }

  handleAddressChange(e) {
    this.setState({newAddress: e.target.value});
  }

  saveUserInfo(e) {
    if (this.state.processing) {
      return;
    } else {
      // if (!this.state.userName || !this.state.password) {
      //   alert("You must enter username and password")
      //   return;
      // }
      this.setState({processing: true})
      let data = {
        "mobileNumber": this.state.newMobileNumber,
        "homeNumber": this.state.newHomeNumber,
        "address": this.state.newAddress
      }  
      axios.put('saveuserinfo', data).then(response => {
        console.log(response);
        this.setState({
          processing: false,
          failedAttempt: true
        })
      })  
    }
  }
  
  render () {
    if (this.state.isLoading === false) {
      return(
        <div>
          <Form>
            <Row>
              <Col>
                <img height="42" width="42" src={this.props.userIcon} alt="No icon"/>
              </Col>
              <Col>
                {this.props.userData.name}
              </Col>
            </Row>
            <Row>
              <Col sm="12" md={{ size: 6, offset: 3 }}>
                <FormGroup>
                  <Label for="mobileNumber">Mobile number: </Label>
                  <Input 
                    type="mobileNumber" name="username" 
                    id="mobileNumber"
                    value={this.state.newMobileNumber} onChange={ (e) => {this.handleMobileNumberChange(e)}}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="homeNumber">Home number: </Label>
                  <Input 
                    type="homeNumber" name="homeNumber" 
                    id="homeNumber"
                    value={this.state.newHomeNumber} onChange={ (e) => {this.handleHomeNumberChange(e)}}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="mailingAddress">Mailing address: </Label>
                  <Input 
                    type="mailingAddress" name="password" 
                    id="mailingAddress"
                    value={this.state.newAddress} onChange={ (e) => {this.handleAddressChange(e)}}
                  />
                </FormGroup>
                <Button onClick={() => {this.saveUserInfo()}}>Save</Button>
              </Col>
            </Row>
          </Form>
        </div>
      );
    } else {
      return(<p></p>);
    }
  }  
}

class FriendConversationPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      conversations: null,
      friendIcon: null,
      friendStatus: null,
      messageToSend: "",
      newMessages: [],
      deletedMessageIds: [],
      allMessageIdsFromFriend: []
    };

    this.deleteMessage = this.deleteMessage.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.keyPress = this.keyPress.bind(this);

  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.clickedFriendId !== prevProps.clickedFriendId) {
      this.setState({
        isLoading: true,
        newMessages: []
      })
      axios
      .get('getconversation/' + this.props.clickedFriendId)
      .then(response => {
        if (response.data) {
          this.setState({
            friendStatus: response.data.friend_status,
            conversations: response.data,
            isLoading: false
          })
        }

        // Retrieve friend's icon
        axios
        .get(
          this.state.conversations.friend_icon,
          { responseType: 'arraybuffer' },
        )
        .then(response => {
          const base64 = btoa(
            new Uint8Array(response.data).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              '',
            ),
          );
          this.setState({ friendIcon: "data:;base64," + base64 });
          console.log('This is called on 2nd click +')
          console.log(this.state.conversations)
        });        
      });    
    } else {
      return true
    }
  }

  componentDidMount() {
    this.setState({isLoading: true})
    axios
    .get('getconversation/' + this.props.clickedFriendId)
    .then(response => {
      if (response.data) {
        // Initially set allMessageIdsFromFriend
        var messages = response.data.messages
        var allMessageIdsFromFriend = []

        messages.forEach(message => {
          allMessageIdsFromFriend.push(message._id)
        })

        this.setState({
          allMessageIdsFromFriend: allMessageIdsFromFriend,
          friendStatus: response.data.friend_status,
          conversations: response.data,
          isLoading: false,
          processing: false
        })

        // Retrieve friend's icon
        axios
        .get(
          this.state.conversations.friend_icon,
          { responseType: 'arraybuffer' },
        )
        .then(response => {
          const base64 = btoa(
            new Uint8Array(response.data).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              '',
            ),
          );
          this.setState({ friendIcon: "data:;base64," + base64 });
          console.log('This is called on initial loading')
          console.log(this.state.conversations)

          this.interval = setInterval(
            () => this.getNewMessages(), 3000
          );
        });
      }
    });
  }

  getNewMessages() {
    console.log('Fetching new message from', this.state.conversations.friend_name)
    axios.get('getnewmessages/' + this.props.clickedFriendId).then(response => {
      if (response.data.newMessages) {
        var updatedNewMessages = this.state.newMessages

        var newMessages = response.data.newMessages
        var allMessageIdsFromFriend = response.data.allMessageIds

        console.log(newMessages)

        newMessages.forEach((message) => {
          updatedNewMessages.push({
            _id: message._id,
            message: message.message,
            date: message.date,
            time: message.time,
            senderId: message.senderId,
            receiverId: message.receiverId
          })  
        })

        this.setState({
          friendStatus: response.data.friendStatus,
          newMessages: updatedNewMessages,
          allMessageIdsFromFriend: allMessageIdsFromFriend
        })    
      }
    })
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  handleChange(e) {
    this.setState({ messageToSend: e.target.value });
  }

  keyPress(e){
    if (this.state.processing) { return; }

    if(e.keyCode === 13){
      if (e.target.value) {
        console.log('Message to be sent: ', e.target.value);
        // search here
        this.setState({processing: true})

        var date_object = new Date()
        var date = date_object.toISOString();
        var time = date_object.toString().slice(15, 25);
        let data = {
          "message": this.state.messageToSend,
          "date": date,
          "time": time
        }  

        axios.post('postmessage/'+this.props.clickedFriendId, data).then(response => {
          console.log(response);
          if (response.data.id) {
            // To be implement
            console.log("Message has been created")
            var updatedNewMessages = this.state.newMessages

            updatedNewMessages.push({
              _id: response.data.id,
              message: response.data.message,
              date: date,
              time: time,
              senderId: response.data.senderId,
              receiverId: response.data.receiverId
            })
  
            this.setState({
              newMessages: updatedNewMessages,
              messageToSend: '',
              processing: false
            })    
          } else {
            this.setState({
              processing: false,
            })
          }
        })    
      }
    }
  }

  deleteMessage(e) {
    const id = e.currentTarget.id;
    console.log('Double click event has been received!')
    console.log(id)
    axios.delete('deletemessage/' + id).then(response => {
      console.log(response.data)
      if (response.data === "Message is successfully deleted") {
        console.log("Message has been deleted")
        var newDeletedMessageIds = this.state.deletedMessageIds
        newDeletedMessageIds.push(id)
        this.setState({
          deletedMessageIds: newDeletedMessageIds
        })
      }
    })

  }

  render() {
    if (this.state.isLoading === false) {

      var messageRows = []
      var date = null
      const messages = this.state.conversations.messages
      var newMessages = this.state.newMessages

      messages.slice().reverse().concat(newMessages).forEach((message) => {
        // Create a date handler
        var message_date = moment(message.date).format('MMM DD, YYYY')
        var message_time = moment(message.date).format('hh:mm a')

        if (message_date !== date) {
          // Insert Date row 
          messageRows.push(
            <Row key={uuid.v4()}>
              <Col align='center'>
                <h5>{message_date}</h5>
              </Col>
            </Row>
          )
          date = message_date
        }

        console.log('debug starts here')
        console.log(this.state.allMessageIdsFromFriend)
        if (message.senderId === this.props.clickedFriendId &&
            this.state.allMessageIdsFromFriend.includes(message._id)) 
        {
          // Friend's message
          messageRows.push(
            <Row key={message._id} id={message._id} onDoubleClick={(e) => this.deleteMessage(e)}
            >
              <Col align='left' xs="6" sm="4">
                <p>
                  <img height="42" width="42" src={this.state.friendIcon} alt="No icon"/>
                  {message.message}
                </p>
              </Col>
              <Col xs="6" sm="4">
                <p></p>
              </Col>
              <Col align='right' sm="4">
                {message_time}
              </Col>
            </Row>
          )
        } else if ( message.senderId === this.props.userData.id && 
                    !this.state.deletedMessageIds.includes(message._id)) 
        {
          // User's message
          messageRows.push(
            <Row key={message._id} id={message._id} onDoubleClick={(e) => {
              if (window.confirm('Are you sure you wish to delete this message?')) this.deleteMessage(e)}}
            >
              <Col xs="6" sm="4">
                <p>
                </p>
              </Col>
              <Col align='right' xs="6" sm="4">
                <p>{message.message}</p>
              </Col>
              <Col align='right' sm="4">
                {message_time}
              </Col>
            </Row>
          )
        }
      })

      return(
        <Container>
          <div>
            <Row>
              <Col>
                <h4 style={{'background': '#DDF6F5'}}>
                  <img height="42" width="42" src={this.state.friendIcon} alt="No icon"/>
                  {this.state.conversations.friend_name}({this.state.friendStatus})
                </h4>
              </Col>
            </Row>
          </div>
          <div 
            style={{
              'background': '#DEE6E6',
              'height': '700px', 
              'overflowY': 'auto',
              'overflowX': 'hidden'
            }}
          >
            {messageRows} 
          </div>
          <div
            style={{
              'width': '900px'
            }}
          >
            <Row>
              <InputGroup>
                <Input
                  value={this.state.messageToSend}
                  placeholder="Press Enter to send message"
                  onKeyDown={this.keyPress}
                  onChange={this.handleChange}
                />
              </InputGroup>
            </Row>
          </div>
        </Container>
      )
    } else {
      return(
        <Spinner color="dark" />
      )
    }
  }
}

class MainDisplay extends React.Component {
  render() {
    if (this.props.mainDisplayStatus === 'userProfile') {
      return (
        <EditUserInfo
          userIcon={this.props.userIcon}
          userData={this.props.userData}
        />
      );        
    } else if (this.props.mainDisplayStatus === null) {
      return (
        <p></p>
      )
    } else if (this.props.mainDisplayStatus === 'friendConversation') {
      return (
        <FriendConversationPage 
          clickedFriendId={this.props.clickedFriendId}
          userData={this.props.userData}
          userIcon={this.props.userIcon}>
        </FriendConversationPage>
      )
    }
  }
}

class AlertBar extends React.Component {
  render() {
    if (this.props.failedAttempt === true){
      return(
        <Alert color="danger">Login failure</Alert>
      );
    } else {
      return null;
    }
  }

}

class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: '',
      inStockOnly: false,
      processing: false,
      failedAttempt: false
    };
  }

  login(e) {
    if (this.state.processing) {
      return;
    } else {
      if (!this.state.userName || !this.state.password) {
        alert("You must enter username and password")
        return;
      }
      this.setState({processing: true})
      let data = {
        "username": this.state.userName,
        "password": this.state.password
      }  
      axios.post('login', data).then(response => {
        console.log(response);
        if (response.data.id) {
          this.setState({processing: false})
          this.props.goToMainPage(response.data);
        } else {
          this.setState({
            processing: false,
            failedAttempt: true
          })
        }
      })  
    }
  }
  
  handleUserNameChange(e) {
    this.setState({userName: e.target.value});
  }

  handlePasswordChange(e) {
    this.setState({password: e.target.value});
  }

  render() {
    return (
          <div className="row h-100">
            <div className="col-sm-12 mt-5">
              <Container>
                <div>
                  <Form>
                    <Row>
                      <Col sm="12" md={{ size: 6, offset: 3 }}>
                        <h1>ChatterBox</h1>
                        <AlertBar failedAttempt={this.state.failedAttempt}/>
                        <FormGroup>
                          <Label for="exampleEmail">Username</Label>
                          <Input 
                            type="username" name="username" 
                            id="exampleEmail" placeholder="Enter your username here.." 
                            value={this.props.userName} onChange={ (e) => {this.handleUserNameChange(e)}}
                          />
                        </FormGroup>
                        <FormGroup>
                          <Label for="examplePassword">Password</Label>
                          <Input 
                            type="password" name="password" 
                            id="examplePassword" placeholder="Enter your password here.." 
                            value={this.props.password} onChange={ (e) => {this.handlePasswordChange(e)}}
                          />
                        </FormGroup>
                        <Button onClick={() => {this.login()}}>Sign in</Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              </Container>
            </div> 
          </div>
   );
  }  
}


class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userIcon: null,
      mainDisplayStatus: null,
      clickedFriendId: null
    };

    this.editUserProfile = this.editUserProfile.bind(this)
    this.loadFriendConversation = this.loadFriendConversation.bind(this)
  }

  componentDidMount() {
    axios
      .get(
        this.props.userData.icon,
        { responseType: 'arraybuffer' },
      )
      .then(response => {
        const base64 = btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            '',
          ),
        );
        this.setState({ userIcon: "data:;base64," + base64 });
      });
  }

  logout(e) {
    axios.get('logout').then(response => {
      console.log(response)
      this.props.goToLoginPage()
    })
  }

  loadFriendConversation(event) {
    const id = event.target.id;
    console.log(id)
    this.setState({
      mainDisplayStatus: 'friendConversation',
      clickedFriendId: id
    })

  }

  editUserProfile(event) {
    this.setState({
      mainDisplayStatus: 'userProfile'
    })
  }

  render() {
    // Loop through friends and push ListGroupItem into the array
    var friendsRows = []
    var friends;
    friends = this.props.userData.friends
    friends.forEach((friend) => {
      if (friend.id === this.state.clickedFriendId) {
        friendsRows.push(
          <ListGroupItem 
            key={friend.id}
            id={friend.id} 
            className="borderless"
            style={{'backgroundColor': 'coral'}}
          >
            {friend.name}
          </ListGroupItem>
        )  
      } else {
        friendsRows.push(
          <ListGroupItem 
            key={friend.id}
            id={friend.id} 
            className="borderless"
            onClick={this.loadFriendConversation}
          >
            {friend.name}
            ({friend.unReadMessageCount})
          </ListGroupItem>
        )  
      }
    });

    return (
      <Container style={{"maxWidth": "1300px"}}>
        <Row className="mt-5">
          <Col xs="3" onClick={this.editUserProfile}>
          <img height="42" width="42" src={this.state.userIcon} alt="No icon"/>
          {this.props.userData.name}
          </Col>
          <Col align="center">
            <h1>ChatterBox</h1>
          </Col>
          <Col xs="3" align="right">
            <Button 
              color="danger" 
              onClick={() => {this.logout()}}>Log out</Button>
          </Col>
        </Row>
        <Row>
          <Col xs="3">
            <ListGroup>
              <ListGroupItem className="borderless">
                Friends:
              </ListGroupItem>
              {friendsRows}
            </ListGroup>
          </Col>
          <Col>
            <MainDisplay 
              userData={this.props.userData}
              mainDisplayStatus={this.state.mainDisplayStatus}
              userIcon={this.state.userIcon}
              clickedFriendId={this.state.clickedFriendId}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

class ChatterBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userData: null,
      loggedIn: false,
      isLoading: false
    };
    this.goToMainPage = this.goToMainPage.bind(this)
    this.goToLoginPage = this.goToLoginPage.bind(this)
  }

  componentDidMount() {
    this.setState({
      isLoading: true
    })
    axios
      .get('load')
      .then(response => {
        if (response.data) {
          this.setState({
            userData: response.data,
            loggedIn: true
          })
        } 
        this.setState({isLoading: false})
        console.log(response)
      });
  }


  goToMainPage(userData) {
    this.setState({
      userData: userData,
      loggedIn: true
    })
  }

  goToLoginPage() {
    this.setState({
      userData: null,
      loggedIn: false
    })
  }

  render() {
    if (this.state.isLoading === true) {
      return (<Spinner color="dark" />)
    } else {
      if (this.state.loggedIn === true) {
        return (
          <MainPage 
            userData = {this.state.userData}
            goToLoginPage = {this.goToLoginPage}
          />
        );
      } else {
        return (
          <LoginPage 
            goToMainPage = {this.goToMainPage}
          />
        )
      }
    }
  }
}
// ========================================

ReactDOM.render(
  <ChatterBox/>,
  document.getElementById('root')
);

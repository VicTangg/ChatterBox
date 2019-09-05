import React from 'react';
import ReactDOM from 'react-dom';

import { Container, Row, Col} from 'reactstrap';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: '',
      inStockOnly: false,
    };
  }

  render() {
    return (
      <div>
        <h1>Chatterbox</h1>
        <Form>
          <FormGroup>
            <Label for="exampleEmail">Email</Label>
            <Input type="email" name="email" id="exampleEmail" placeholder="with a placeholder" />
          </FormGroup>
          <FormGroup>
            <Label for="examplePassword">Password</Label>
            <Input type="password" name="password" id="examplePassword" placeholder="password placeholder" />
          </FormGroup>
          <Button>Sign in</Button>
        </Form>
      </div>
    );
  }  
}

// ========================================

ReactDOM.render(
  <LoginPage/>,
  document.getElementById('root')
);

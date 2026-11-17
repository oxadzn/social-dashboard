import { Component } from 'react';

// CLASS component used to demonstrate lifecycle methods for the project write-up.
// Shows "Updated Xs ago" and ticks every second.
export default class LastUpdated extends Component {
  state = { seconds: 0 };
  timer = null;

  componentDidMount() {
    // Runs once after first render -> start the timer
    this.timer = setInterval(() => this.setState((s) => ({ seconds: s.seconds + 1 })), 1000);
  }

  componentDidUpdate(prevProps) {
    // Runs after every update -> reset the counter when fresh data arrives
    if (prevProps.stamp !== this.props.stamp) this.setState({ seconds: 0 });
  }

  componentWillUnmount() {
    // Runs just before removal -> clean up
    clearInterval(this.timer);
  }

  render() {
    return <span className="last-updated">Updated {this.state.seconds}s ago</span>;
  }
}

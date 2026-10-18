import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(err) {
    console.warn('3D scene disabled:', err?.message)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
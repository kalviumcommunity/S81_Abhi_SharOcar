import { useParams } from 'react-router-dom'
import './pages.css'

export default function RideBooking(){
  const { id } = useParams()
  return (
    <div className="rc-page">
      <h2>Ride Booking</h2>
      <p>Ride ID: {id}</p>
      <p>This page can be extended for a detailed ride view and booking confirmation.</p>
    </div>
  )
}

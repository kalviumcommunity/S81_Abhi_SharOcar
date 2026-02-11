import { useParams } from 'react-router-dom'
import './pages.css'

export default function ParcelBooking(){
  const { id } = useParams()
  return (
    <div className="rc-page">
      <h2>Parcel Booking</h2>
      <p>Ride ID: {id}</p>
      <p>Submit parcel details and confirm payment here.</p>
    </div>
  )
}

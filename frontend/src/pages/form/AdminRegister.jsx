import { useState } from 'react'
import view from "/assets/icons/view.png"
import hide from "/assets/icons/hide.png"
import axiosuserapi from "../../api/axiosuserapi";
import { useNavigate, Navigate } from 'react-router-dom';

function AdminRegister() {
  const navigate = useNavigate();
 const [hidepass, setHidepass] = useState(false);

 const [formData, setFormData] = useState({
  ownerName: "",
  email: "",
  phoneNo: "",
  password: "",
 });

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value
  }));
};

const handleSubmit = async (e) =>{
  e.preventDefault();
  
  try {
     const response = await axiosuserapi.post("/admin/register", formData, { withCredentials: true });
     
    navigate("/vibe/admin/login")
   
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Something went wrong";
    alert(errorMessage); 
   
  }
}

  return (
    <>
    <div className='w-full h-screen overflow-hidden bg-white relative text-color-black flex items-center justify-center'>
      <div className='w-full flex flex-wrap items-center justify-center'>
        <div className='border-4 border-zinc-900 w-110 py-5 mt-3 rounded-2xl'>
          <h1 className='text-3xl font-bold text-center mb-4 text-zinc-900'>Admin Registration</h1>

          <form className = "flex flex-col items-center justify-center space-y-4 px-4" onSubmit={handleSubmit}>
            <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder='enter your name' className='text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500  ' />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder='enter your email' className='text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500  ' />
            <input type="number" name="phoneNo" value={formData.phoneNo} onChange={handleChange} placeholder='enter your phone number' className='text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500  ' />
            <div className='relative '>
              <input type={hidepass ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder='enter your password' className='text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500  ' />
              <img
                src={hidepass ? hide : view}
                alt="Toggle Password Visibility"
                onClick={() => setHidepass(!hidepass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer w-6 h-6 opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
            
            <button type="submit" className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600'>Register</button>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}

export default AdminRegister
import React from "react";
import axiositemsapi from "../../api/axiositemsapi";
import { useState, useEffect } from "react";

function ItemForm() {
  const [formData, setFormData] = useState({
    brandName: "",
    price: "",
    itemCategory: "",
    description: "",
    images: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const images = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.images.length === 0) {

      return;
    }

    try {
      const payload = new FormData();
      payload.append("brandName", formData.brandName);
      payload.append("price", formData.price);
      payload.append("itemCategory", formData.itemCategory);
      payload.append("description", formData.description);
      formData.images.forEach((image) => payload.append("images", image));

      const response = await axiositemsapi.post("/", payload, {
        withCredentials: true,
      });
      if (response.status === 201) {

        alert("item added successfully");
        setFormData({
          brandName: "",
          price: "",
          itemCategory: "",
          description: "",
          images: [],
        });

        e.target.reset();
      }
    } catch (err) {
      alert("Failed to add item. Please try again.");
    }
  };

  return (
    <>
      <div className="w-full flex flex-wrap items-center justify-center overflow-hidden bg-white relative text-color-black font-[poppins]">
        <div className="w-full flex flex-wrap items-center justify-center">
          <div className="border-4 border-zinc-900 w-110 py-5 mt-3 rounded-2xl">
            <h1 className="text-3xl font-bold text-center mb-4 text-zinc-900">
              Add New Item
            </h1>
            <form
              action=""
              className="flex flex-col items-center justify-center space-y-4 px-4"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                placeholder="enter item name"
                name="brandName"
                onChange={handleChange}
                className="text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500  "
              />
              <input
                type="number"
                placeholder="enter item price"
                name="price"
                onChange={handleChange}
                className="text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500  "
              />
              <input
                type="text"
                placeholder="enter item category"
                name="itemCategory"
                onChange={handleChange}
                className="text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500  "
              />
              <textarea
                placeholder="enter item description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="text-zinc-500 outline-none border-2 border-gray-300 rounded-md px-7 py-1 hover:border-blue-500"
                required
              />
              <input
                type="file"
                name="images"
                onChange={handleFileChange}
                className=" text-zinc-500 outline-none border-2 border-gray-300 rounded-md  py-1 ml-[] w-[64%]"
                accept="image/*"
                multiple
                required
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default ItemForm;

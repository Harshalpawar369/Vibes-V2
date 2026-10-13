import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../components/Footer";
import ItemForm from "../form/itemForm";
import { fetchAdminOrders } from "../../redux/features/orderSlice";

function AdminPanel() {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  return (
    <>
      <div className="w-full text-zinc-950 font-[poppins] bg-white p-5">
        <ItemForm />

        <div className="pt-10 flex flex-col items-center justify-center">
          <div>
            <h1 className="text-3xl font-bold text-center mb-4 text-zinc-900">
              Orders
            </h1>
          </div>

          <div className="w-full max-w-5xl space-y-4">
            {status === "loading" ? (
              <div className="border-4 border-zinc-900 rounded-2xl p-4 font-semibold text-center">
                Loading orders...
              </div>
            ) : status === "failed" ? (
              <div className="border-4 border-red-500 rounded-2xl p-4 font-semibold text-center text-red-600">
                {error?.message || error || "Failed to load orders."}
              </div>
            ) : orders.length === 0 ? (
              <div className="border-4 border-zinc-900 rounded-2xl p-4 font-semibold text-center">
                No orders found.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order._id}
                  className="border-4 border-zinc-900 rounded-2xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-bold">Order ID: {order._id}</p>
                      <p className="font-semibold">Address: {order.address}</p>
                      <p className="font-semibold">Phone: {order.phoneNO}</p>
                    </div>
                    <div className="text-left md:text-right">
                   
<p className="font-bold">Total: ₹{order.totalPrice?.amount}</p>
                      <p className="font-semibold">
                        Delivered: {order.isDelivered ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {order.items?.map((line) => (
                      <div
                        key={line._id || `${order._id}-${line.item?._id}`}
                        className="border-2 border-zinc-900 rounded-xl p-2"
                      >
                        <p className="font-semibold">
                          {line.item?.brandName ?? line.item?.name ?? "Item"}
                        </p>
                        <p className="font-semibold">Qty: {line.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default AdminPanel;

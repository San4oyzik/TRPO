import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/toast.css";

export default function ServiceManager() {
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    description: "",
    employeeIds: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchServices();
    fetchEmployees();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch("http://localhost:8000/services", { headers });
      const data = await res.json();
      setServices(data);
    } catch (error) {
      toast.error("Ошибка загрузки услуг");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8000/user", { headers });
      const data = await res.json();
      const employeesOnly = data.filter((u) => u.roles?.includes("employee"));
      setEmployees(employeesOnly);
    } catch (error) {
      toast.error("Ошибка загрузки сотрудников");
    }
  };

  const openModal = () => {
    setForm({
      name: "",
      price: "",
      duration: "",
      description: "",
      employeeIds: [],
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (service) => {
    const extractedIds = (service.employeeIds || []).map((emp) =>
      typeof emp === "object" && emp._id ? String(emp._id) : String(emp)
    );

    setForm({
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description || "",
      employeeIds: extractedIds,
    });
    setEditingId(service._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить услугу?")) return;
    try {
      await fetch(`http://localhost:8000/services/${id}`, {
        method: "DELETE",
        headers,
      });
      fetchServices();
      toast.success("Услуга удалена");
    } catch (error) {
      toast.error("Ошибка при удалении услуги");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmployeeToggle = (id) => {
    setForm((prev) => {
      const ids = new Set(prev.employeeIds);
      ids.has(id) ? ids.delete(id) : ids.add(id);
      return { ...prev, employeeIds: Array.from(ids) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://localhost:8000/services/${editingId}`
      : "http://localhost:8000/services";

    try {
      await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form),
      });

      setIsModalOpen(false);
      fetchServices();
      toast.success(editingId ? "Услуга обновлена" : "Услуга добавлена");
    } catch (error) {
      toast.error("Ошибка при сохранении услуги");
    }
  };

  const getEmployeeNames = (list = []) => {
    if (!Array.isArray(list) || list.length === 0) return "-";

    const isPopulated = typeof list[0] === "object" && list[0].fullName;
    if (isPopulated) {
      return list.map((e) => e.fullName).join(", ");
    }

    return employees
      .filter((e) => list.includes(e._id))
      .map((e) => e.fullName)
      .join(", ");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-[#f5f5f5] min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-[#14532d]">Управление услугами</h2>

      <button
        onClick={openModal}
        className="mb-6 bg-[#14532d] text-white px-5 py-2 rounded hover:bg-[#15803d] transition"
      >
        + Добавить услугу
      </button>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded shadow">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 border-b">Название</th>
              <th className="p-3 border-b">Цена</th>
              <th className="p-3 border-b">Длительность</th>
              <th className="p-3 border-b">Описание</th>
              <th className="p-3 border-b">Сотрудники</th>
              <th className="p-3 border-b text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s._id} className="hover:bg-[#f9fafb]">
                <td className="p-3 border-b">{s.name}</td>
                <td className="p-3 border-b">{s.price} ₽</td>
                <td className="p-3 border-b">{s.duration} мин</td>
                <td className="p-3 border-b">{s.description || "-"}</td>
                <td className="p-3 border-b">{getEmployeeNames(s.employeeIds)}</td>
                <td className="p-3 border-b text-center space-y-2 flex flex-col items-center">
                  <button
                    onClick={() => handleEdit(s)}
                    className="w-[120px] py-1 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-500 transition"
                    title="Редактировать услугу"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="w-[120px] py-1 bg-[#dc2626] text-white font-medium rounded hover:bg-red-700 transition"
                    title="Удалить услугу"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модалка */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-[#14532d]">
              {editingId ? "Редактировать услугу" : "Добавить услугу"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Название"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                required
              />
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Цена"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                required
              />
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="Длительность (мин)"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#15803d]"
                required
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Описание"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#15803d]"
              />

              <div>
                <p className="font-medium mb-1">Привязка сотрудников:</p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 p-2 rounded">
                  {employees.map((emp) => (
                    <label key={emp._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={emp._id}
                        checked={form.employeeIds.includes(emp._id)}
                        onChange={() => handleEmployeeToggle(emp._id)}
                      />
                      {emp.fullName}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#14532d] text-white rounded hover:bg-[#15803d]"
                >
                  {editingId ? "Сохранить" : "Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

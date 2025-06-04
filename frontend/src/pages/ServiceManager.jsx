import { useEffect, useState } from "react";

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
    const res = await fetch("http://localhost:8000/services", { headers });
    const data = await res.json();
    setServices(data);
  };

  const fetchEmployees = async () => {
    const res = await fetch("http://localhost:8000/user", { headers });
    const data = await res.json();
    const employeesOnly = data.filter((u) => u.roles?.includes("employee"));
    setEmployees(employeesOnly);
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
    await fetch(`http://localhost:8000/services/${id}`, {
      method: "DELETE",
      headers,
    });
    fetchServices();
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

    await fetch(url, {
      method,
      headers,
      body: JSON.stringify(form),
    });

    setIsModalOpen(false);
    fetchServices();
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
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Управление услугами</h2>

      <button
        onClick={openModal}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Добавить услугу
      </button>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Название</th>
            <th className="border p-2">Цена</th>
            <th className="border p-2">Длительность</th>
            <th className="border p-2">Описание</th>
            <th className="border p-2">Сотрудники</th>
            <th className="border p-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s._id}>
              <td className="border p-2">{s.name}</td>
              <td className="border p-2">{s.price} ₽</td>
              <td className="border p-2">{s.duration} мин</td>
              <td className="border p-2">{s.description || "-"}</td>
              <td className="border p-2">{getEmployeeNames(s.employeeIds)}</td>
              <td className="border p-2 space-x-2 text-center">
                <button
                  onClick={() => handleEdit(s)}
                  className="px-2 py-1 bg-yellow-400 text-white rounded"
                >
                  ✏
                </button>
                <button
                  onClick={() => handleDelete(s._id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Модалка */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? "Редактировать услугу" : "Добавить услугу"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Название"
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Цена"
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="Длительность (мин)"
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Описание"
                className="w-full p-2 border rounded"
              />

              <div>
                <p className="font-medium mb-1">Привязка сотрудников:</p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border p-2 rounded">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

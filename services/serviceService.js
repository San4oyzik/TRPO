const { Service } = require('../models/serviceSchema');
const { User } = require('../models/userSchema');

async function createService(data) {
  const service = new Service(data);
  const savedService = await service.save();

  if (data.employeeIds?.length) {
    await User.updateMany(
      { _id: { $in: data.employeeIds } },
      { $addToSet: { services: savedService._id } }
    );
  }

  return savedService;
}

async function getAllServices() {
  return await Service.find({}).populate('employeeIds', 'fullName');
}

async function getServiceById(id) {
  return await Service.findById(id).populate('employeeIds', 'fullName');
}

async function updateService(id, data) {
  // Обновляем саму услугу
  const updated = await Service.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw new Error('Услуга не найдена');

  // Удаляем эту услугу у всех сотрудников, кроме тех, кто в employeeIds
  await User.updateMany(
    { services: id, _id: { $nin: data.employeeIds } },
    { $pull: { services: id } }
  );

  // Добавляем услугу всем указанным сотрудникам (если ещё не добавлена)
  await User.updateMany(
    { _id: { $in: data.employeeIds } },
    { $addToSet: { services: id } }
  );

  return updated;
}

async function deleteService(id) {
  // Удаляем ссылку на услугу у всех сотрудников
  await User.updateMany(
    { services: id },
    { $pull: { services: id } }
  );

  return await Service.findByIdAndDelete(id);
}

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
};

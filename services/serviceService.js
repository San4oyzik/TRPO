const { Service } = require('../models/serviceSchema');

async function createService(data) {
  const service = new Service(data);
  return await service.save();
}

async function getAllServices() {
  return await Service.find({});
}

async function getServiceById(id) {
  return await Service.findById(id);
}

async function updateService(id, data) {
  return await Service.findByIdAndUpdate(id, data, { new: true });
}

async function deleteService(id) {
  return await Service.findByIdAndDelete(id);
}

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
};

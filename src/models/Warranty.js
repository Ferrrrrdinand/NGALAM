const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Warranty = sequelize.define('Warranty', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    warranty_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    order_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    customer_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    customer_whatsapp: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    customer_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    device_type: {
      type: DataTypes.STRING(100),
      defaultValue: 'Smartphone'
    },
    brand_model: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    service_item: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    warranty_type_label: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    duration_days: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active' // active, expired, claimed, void
    },
    claim_status: {
      type: DataTypes.STRING(50),
      defaultValue: 'none' // none, pending, approved, in_repair, resolved, rejected
    },
    claim_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    claim_history: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    technician_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'warranties',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Warranty;
};


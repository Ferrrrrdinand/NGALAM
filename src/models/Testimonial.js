const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Testimonial = sequelize.define('Testimonial', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    device: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'testimonials',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Testimonial;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Banner = sequelize.define('Banner', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    badge_tag: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    badge_pill: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    promo_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    button_text: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    button_link: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'banners',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Banner;
};

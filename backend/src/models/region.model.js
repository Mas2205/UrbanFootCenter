module.exports = (sequelize, DataTypes, defaultOptions) => {
  const Region = sequelize.define('Region', {
    id: {
      ...defaultOptions.id
    },
    region_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'region_name'
    },
    department_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'department_name'
    },
    city_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'city_name'
    },
    region_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'region_code'
    },
    department_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'department_code'
    },
    population: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    area_km2: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'area_km2'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    }
  }, {
    tableName: 'regions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['region_name']
      },
      {
        fields: ['department_name']
      },
      {
        fields: ['city_name']
      },
      {
        fields: ['region_name', 'department_name']
      }
    ]
  });

  return Region;
};

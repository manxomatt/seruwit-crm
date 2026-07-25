<?php

return [
    'title' => 'Products',

    'nav' => [
        'products' => 'Products',
        'principals' => 'Principals',
        'brands' => 'Brands',
        'product_types' => 'Product Types',
        'attributes' => 'Attributes',
        'tags' => 'Tags',
    ],

    'status' => [
        'active' => 'Active',
        'inactive' => 'Inactive',
        'all' => 'All statuses',
    ],

    'categories' => [
        'merchandise' => 'Merchandise',
        'fleet_sparepart' => 'Spare Part',
        'service' => 'Service',
        'all' => 'All categories',
    ],

    'tracking' => [
        'qty' => 'By Quantity',
        'serial' => 'By Serial',
        'lot' => 'By Lot',
        'none' => 'No Tracking',
    ],

    'attribute_types' => [
        'select' => 'Select',
        'color' => 'Color',
        'radio' => 'Radio',
        'checkbox' => 'Checkbox',
    ],

    'tag_colors' => [
        'none' => 'No color',
        'red' => 'Red',
        'blue' => 'Blue',
        'green' => 'Green',
        'yellow' => 'Yellow',
        'purple' => 'Purple',
        'orange' => 'Orange',
        'pink' => 'Pink',
        'gray' => 'Gray',
    ],

    'fields' => [
        'name' => 'Name',
        'code' => 'Code',
        'sku' => 'SKU',
        'barcode' => 'Barcode',
        'brand' => 'Brand',
        'principal' => 'Principal',
        'product_type' => 'Product Type',
        'category' => 'Category',
        'status' => 'Status',
        'tracking' => 'Tracking',
        'unit' => 'Unit',
        'price' => 'Price',
        'cost' => 'Cost',
        'description' => 'Description',
        'notes' => 'Notes',
        'parent' => 'Parent',
        'color' => 'Color',
        'type' => 'Type',
        'options' => 'Options',
        'is_inventoried' => 'Inventoried',
        'min_stock' => 'Min Stock',
        'max_stock' => 'Max Stock',
        'weight' => 'Weight',
        'packagings' => 'Packagings',
        'attributes' => 'Attributes',
        'tags' => 'Tags',
        'contact' => 'Contact',
        'phone' => 'Phone',
        'email' => 'Email',
        'address' => 'Address',
        'contact_name' => 'Contact Name',
        'sort_order' => 'Sort Order',
        'sub_type' => 'Sub-Type',
        'volume' => 'Volume (m³)',
        'variants' => 'Variants',
    ],

    'placeholders' => [
        'search' => 'Search name, code, SKU…',
        'select_brand' => 'Select brand',
        'select_principal' => 'Select principal',
        'select_type' => 'Select type',
        'select_parent' => 'Select parent (optional)',
        'optional' => 'Optional',
    ],

    'products' => [
        'index' => [
            'head' => 'Products',
            'new' => 'Add Product',
            'empty' => 'No products yet.',
            'columns' => [
                'code' => 'Code',
                'name' => 'Name',
                'brand' => 'Brand',
                'category' => 'Category',
                'status' => 'Status',
            ],
            'delete_title' => 'Delete Product',
            'delete_confirm' => 'Delete ":name" (:code)?',
        ],
        'create' => [
            'title' => 'Add Product',
            'submit' => 'Save Product',
        ],
        'edit' => [
            'title' => 'Edit :name',
            'submit' => 'Save Changes',
        ],
        'show' => [
            'edit' => 'Edit',
            'back' => 'Back to List',
            'general' => 'General',
            'inventory' => 'Inventory',
            'pricing' => 'Pricing',
            'packagings' => 'Packagings',
            'attributes' => 'Attributes',
            'tags' => 'Tags',
            'delete_zone_title' => 'Delete this product',
            'delete_zone_hint' => 'This cannot be undone.',
            'delete_action' => 'Delete Product',
            'delete_title' => 'Delete Product',
            'delete_confirm' => 'Delete ":name" (:code)?',
        ],
    ],

    'brands' => [
        'index' => [
            'head' => 'Brands',
            'new' => 'Add Brand',
            'empty' => 'No brands yet.',
            'columns' => [
                'name' => 'Name',
                'principal' => 'Principal',
                'status' => 'Status',
            ],
            'delete_title' => 'Delete Brand',
            'delete_confirm' => 'Delete brand ":name"?',
        ],
        'create' => [
            'title' => 'Add Brand',
            'submit' => 'Save Brand',
        ],
        'edit' => [
            'title' => 'Edit Brand',
            'submit' => 'Save Changes',
        ],
    ],

    'principals' => [
        'index' => [
            'head' => 'Principals',
            'new' => 'Add Principal',
            'empty' => 'No principals yet.',
            'columns' => [
                'name' => 'Name',
                'code' => 'Code',
                'status' => 'Status',
            ],
            'delete_title' => 'Delete Principal',
            'delete_confirm' => 'Delete ":name"? This cannot be undone.',
        ],
        'create' => [
            'title' => 'Add Principal',
            'submit' => 'Save Principal',
        ],
        'edit' => [
            'title' => 'Edit Principal',
            'submit' => 'Save Changes',
        ],
    ],

    'product_types' => [
        'index' => [
            'head' => 'Product Types',
            'new' => 'Add Type',
            'empty' => 'No product types yet.',
            'columns' => [
                'name' => 'Name',
                'parent' => 'Parent',
            ],
            'delete_title' => 'Delete Product Type',
            'delete_confirm' => 'Delete type ":name"?',
        ],
        'create' => [
            'title' => 'Add Product Type',
            'submit' => 'Save Type',
        ],
        'edit' => [
            'title' => 'Edit Product Type',
            'submit' => 'Save Changes',
        ],
    ],

    'attributes' => [
        'index' => [
            'head' => 'Product Attributes',
            'new' => 'Add Attribute',
            'empty' => 'No attributes yet.',
            'columns' => [
                'name' => 'Name',
                'type' => 'Type',
                'options' => 'Options',
            ],
            'delete_title' => 'Delete Attribute',
            'delete_confirm' => 'Delete attribute ":name"? All options will also be deleted.',
        ],
        'create' => [
            'title' => 'Add Attribute',
            'submit' => 'Save Attribute',
            'add_option' => 'Add Option',
        ],
        'edit' => [
            'title' => 'Edit Attribute',
            'submit' => 'Save Changes',
            'add_option' => 'Add Option',
        ],
    ],

    'tags' => [
        'index' => [
            'head' => 'Tags',
            'new' => 'Add Tag',
            'empty' => 'No tags yet.',
            'columns' => [
                'name' => 'Name',
                'color' => 'Color',
            ],
            'delete_title' => 'Delete Tag',
            'delete_confirm' => 'Delete tag ":name"?',
        ],
        'create' => [
            'title' => 'Add Tag',
            'submit' => 'Save Tag',
        ],
        'edit' => [
            'title' => 'Edit Tag',
            'submit' => 'Save Changes',
        ],
    ],

    'validation' => [
        'status_in' => 'Select a valid product status.',
        'category_in' => 'Select a valid inventory category.',
    ],

    'messages' => [
        'product_created' => 'Product created successfully.',
        'product_updated' => 'Product updated successfully.',
        'product_deleted' => 'Product deleted successfully.',
        'product_referenced' => 'This product is still referenced by other records and cannot be deleted.',
        'brand_created' => 'Brand created successfully.',
        'brand_updated' => 'Brand updated successfully.',
        'brand_deleted' => 'Brand deleted successfully.',
        'brand_has_products' => 'Brand still has products and cannot be deleted.',
        'principal_created' => 'Principal created successfully.',
        'principal_updated' => 'Principal updated successfully.',
        'principal_deleted' => 'Principal deleted successfully.',
        'principal_has_brands' => 'Principal still has brands and cannot be deleted.',
        'type_created' => 'Product type created successfully.',
        'type_updated' => 'Product type updated successfully.',
        'type_deleted' => 'Product type deleted successfully.',
        'type_has_products' => 'Product type is still used by products and cannot be deleted.',
        'type_has_children' => 'Product type still has sub-types and cannot be deleted.',
        'attribute_created' => 'Attribute created successfully.',
        'attribute_updated' => 'Attribute updated successfully.',
        'attribute_deleted' => 'Attribute deleted successfully.',
        'tag_created' => 'Tag created successfully.',
        'tag_updated' => 'Tag updated successfully.',
        'tag_deleted' => 'Tag deleted successfully.',
        'tag_in_use' => 'Tag is still used by products and cannot be deleted.',
    ],
];

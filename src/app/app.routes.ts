import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
    { path: 'category/:id', loadComponent: () => import('./components/product-category/product-category.component').then(m => m.ProductCategoryComponent) },
    { path: 'product/:id', loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
    { path: 'blog', loadComponent: () => import('./components/blog-list/blog-list.component').then(m => m.BlogListComponent) },
    { path: 'blog/:slug', loadComponent: () => import('./components/blog-post-detail/blog-post-detail.component').then(m => m.BlogPostDetailComponent) },
    { path: 'about', loadComponent: () => import('./components/about-us/about-us.component').then(m => m.AboutUsComponent) },
    { path: 'contact', loadComponent: () => import('./components/contact-us/contact-us.component').then(m => m.ContactUsComponent) },
    { path: 'admin', loadComponent: () => import('./components/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent) },
    { path: '**', redirectTo: '' }
];

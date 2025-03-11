import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductCarouselComponent } from '@products/components/product-carousel/product-carousel.component';
import { Product } from '@products/interfaces/product.interface';
import { FormUtils } from '@utils/forms-utils';
import { FormErrorLabelComponent } from "../../../../shared/components/form-error-label/form-error-label.component";
import { ProductsService } from '@products/services/products.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'product-details',
  imports: [ProductCarouselComponent, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit{
  product = input.required<Product>();
  productService = inject(ProductsService);
  router = inject(Router);

  wasSave = signal(false);

  imageFileList: FileList | undefined = undefined;
  tempImages = signal<string[]>([]);
  imagesToCarousel = computed(() => {
    const currentProductImages = [...this.product().images, ...this.tempImages(),];
    return currentProductImages;
  })

  fb = inject(FormBuilder);

  productForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(FormUtils.slugPattern)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sizes: [['']],
    images: [[]],
    tags: [''],
    gender: ['hombre', [Validators.required, Validators.pattern(/men|women|kid|unisex/)]],
  })

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  ngOnInit(): void {
    this.setFormValue(this.product());
  }

  setFormValue( formLike: Partial<Product>) {
    // this.productForm.patchValue(formLike as any);
    this.productForm.reset(formLike as any);
    this.productForm.patchValue({ tags: formLike.tags?.join(',')});
  }

  onSizeClick( size: string ) {
    const currentSizes = this.productForm.value.sizes ?? [];

    if( currentSizes.includes(size) ) {
      currentSizes.splice(currentSizes.indexOf(size), 1);
    } else {
      currentSizes.push(size);
    }

    this.productForm.patchValue({ sizes: currentSizes });
  }

  async onSubmit() {
    const isValid = this.productForm.valid;
    this.productForm.markAllAsTouched();

    if(!isValid) return;
    const formValue = this.productForm.value;

    const productLike: Partial<Product> = {
      ...(formValue as any),
      tags: formValue.tags
        ?.toLowerCase()
        .split(',')
        .map((tag) => tag.trim()) ?? [],
    };

    if( this.product().id === 'new' ) {
      const product = await firstValueFrom(this.productService.createProduct(productLike, this.imageFileList));

      this.router.navigate(['/admin/products', product.id ])

    } else {
      await firstValueFrom(this.productService.updateProduct(this.product().id, productLike, this.imageFileList));
    }

    this.wasSave.set(true)
    setTimeout(() => {
      this.wasSave.set(false);
    }, 3000);
  }

  onFilesChanged( event: Event ) {
    const fileList = ( event.target as HTMLInputElement ).files;
    this.tempImages.set([]);
    this.imageFileList = fileList ?? undefined;

    const imageUrls = Array.from( fileList ?? [] ).map(file => URL.createObjectURL(file));
    this.tempImages.set(imageUrls);
  }
}

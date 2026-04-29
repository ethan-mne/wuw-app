import { compileMDX } from 'next-mdx-remote/rsc';
import path from 'path';
import { readFile, access, readdir } from 'fs/promises';
import { notFound } from 'next/navigation';
import { locales } from '@/config';

export const dynamicParams = false;
export const revalidate = false;

export async function generateStaticParams() {
  const POSTS_FOLDER = path.join(process.cwd(), 'src', 'data', 'articles');
  const files = await readdir(POSTS_FOLDER);
  const slugs = files.map((f) => f.replace('.mdx', ''));
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}
import { type FrontMatterType, PostLayout } from './post-layout';
import { PostsCarousel } from './post-carousel';
import type { ReactElement } from 'react';
import type { ComponentType } from 'react';

type MDXComponentsProp = Parameters<typeof compileMDX>[0]['components'];
import {
  Heading,
  MdxImages,
  SingleImage,
  Text,
  NormalText,
} from '../mdx-components';

const allComponents: Record<string, ComponentType<never>> = {
  MdxImages: MdxImages,
  Heading: Heading,
  SingleImage: SingleImage,
  Text: Text,
  NormalText: NormalText,
};

const getComponents = (imports: string[]) => {
  const components: Record<string, ComponentType<never>> = {};

  if (imports) {
    imports.forEach((componentName) => {
      const component = allComponents[componentName];
      if (component !== undefined) {
        components[componentName] = component;
      }
    });
  }
  return components;
};

async function readAllPostFiles(): Promise<
  (FrontMatterType & { slug: string; content: ReactElement })[] | []
> {
  const POSTS_FOLDER = path.join(process.cwd(), 'src', 'data', 'articles');
  try {
    const files = await readdir(POSTS_FOLDER);
    const posts = await Promise.all(
      files.map(async (file) => {
        const filePath = path.resolve(path.join(POSTS_FOLDER, file));
        try {
          await access(filePath);
        } catch (err) {
          return null;
        }
        const fileContent = await readFile(filePath, { encoding: 'utf8' });
        const { frontmatter, content } = await compileMDX<FrontMatterType>({
          source: fileContent,
          options: {
            parseFrontmatter: true,
            blockJS: false,
            mdxOptions: {
              format: 'detect',
            },
          },
          components: allComponents as MDXComponentsProp,
        });

        return { slug: file.replace('.mdx', ''), ...frontmatter, content };
      }),
    );
    return posts.filter((post) => post !== null) as (FrontMatterType & {
      slug: string;
      content: ReactElement;
    })[];
  } catch (err) {
    console.error('Error reading post files:', err);
    return [];
  }
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const posts = await readAllPostFiles();
  const markdown = posts.find((post) => post.slug === params.slug);

  if (!markdown) {
    notFound();
  }

  const { content, ...frontMatter } = markdown;

  return (
    <div className='my-10 flex flex-col gap-14'>
      <PostLayout content={content} frontMatter={frontMatter} />
      <PostsCarousel posts={posts} />
    </div>
  );
}

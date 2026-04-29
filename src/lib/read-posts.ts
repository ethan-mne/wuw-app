import path from 'path';
import { readFile, access, readdir } from 'fs/promises';
import { compileMDX } from 'next-mdx-remote/rsc';
import type { FrontMatterType } from '@/app/[locale]/feed/[slug]/post-layout';
import type { ReactElement } from 'react';

export async function readAllPostFiles(): Promise<
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
        const { frontmatter } = await compileMDX<FrontMatterType>({
          source: fileContent,
          options: {
            parseFrontmatter: true,
            blockJS: false,
            mdxOptions: {
              format: 'detect',
            },
          },
        });
        return { slug: file.replace('.mdx', ''), ...frontmatter };
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

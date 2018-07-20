import os
import shutil
import json
from collections import defaultdict

outdir = 'out'
rawdir = 'raw'
data = defaultdict(list)
base_url = 'http://www.deckardsdream.com/wp-content/uploads/2017/04/'

import re
exp = re.compile(r'[0-9]x[0-9]')

for filename in os.listdir(rawdir):
	if filename.endswith('.jpg') and not exp.search(filename):
		board, number, name = [elm for elm in filename.split('_') if elm][0:3]
		number = int(number)
		layer_number = None
		if 'Layer' in filename:
			try:
				layer_number = int(filename.replace('-copy', '').split('Layer-')[1].split('.jpg')[0])
			except:
				pass
		data[board].append((layer_number, name, filename))

json_index = defaultdict(list)
for board, pics in data.items():
	pics = sorted(pics, key=lambda x: x[0])
	n_nones = 1
	for layer_number, name, filename in pics:
		if layer_number is not None:
			number_label = '%.2i' % layer_number
		else:
			number_label = '00_%i' % n_nones
			n_nones += 1
		dest_filename = '%s/%s_%s.jpg' % (outdir, board, number_label)
		shutil.copy('%s/%s' % (rawdir, filename), dest_filename)

		remote_url = base_url + filename
		local_url = dest_filename
		
		description = ''
		import random
		if random.random() > 0.5:
			description = 'This is a test description to know where to place it'

		json_index[board].append((remote_url, local_url, description))

json.dump(json_index, open('index.json', 'w'))
